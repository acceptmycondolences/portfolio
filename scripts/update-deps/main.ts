// Обновляет зависимости проекта (pnpm deps:update). Порядок, коды завершения и причины — в README.md
// рядом с этим файлом. Здесь — команды, файлы и откат; решения принимает plan.ts.
// 1. Пакеты шаблона Vite (react-ts) получают диапазоны из свежесозданного шаблона, @types/node вне шаблона — из .nvmrc;
//    они обновляются только в пределах этих диапазонов.
// 2. Остальные пакеты и pnpm обновляются в пределах мажорной версии; если проверка не проходит — полный откат.
// 3. Мажорные обновления пакетов, pnpm и LTS-версии Node.js пробуются по очереди; каждое остаётся, только если
//    проходят pnpm check и vite build.
// Node.js 24 выполняет файл напрямую, удаляя типы, поэтому допустим только стираемый синтаксис TypeScript.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { acquireUpdateLock } from './lock.ts'
import {
  describeLag,
  groupRelated,
  latestLts,
  major,
  majorCandidates,
  nodeMajorFromOutput,
  parseManifest,
  parseOutdated,
  pinRanges,
  planNode,
  planPnpm,
  type Manifest,
  type NodeRelease,
  type Outdated,
  type PnpmPlan,
  type Ranges,
} from './plan.ts'
import { restore, type Snapshot } from './recovery.ts'

/** Одно обновление, которое применяется целиком или откатывается. */
interface Candidate {
  apply: () => Promise<void>
  /** Что сообщить человеку, если обновление откатилось. */
  failure?: string
  label: string
  /** Что сообщить человеку, если обновление прошло. */
  success?: string
}

// Шаблон create-vite, от которого берутся версии.
const TEMPLATE = 'react-ts'
// Файлы, которые меняет обновление; их снимок восстанавливается при неудаче.
const FILES = ['package.json', 'pnpm-lock.yaml', '.nvmrc']
// Снимок на диске переживает закрытие терминала и аварийное завершение: следующий запуск восстановит его.
// node_modules/.tmp не трогает pnpm и не попадает в git.
const BACKUP = 'node_modules/.tmp/deps-update-backup.json'
const LOCK = 'node_modules/.tmp/deps-update.lock'
// Версии файлов, которые заменил откат прерванного запуска, если их успели изменить вручную.
const REPLACED = 'node_modules/.tmp/deps-update-replaced.json'
// Коды завершения: 2 — обновление прошло, но часть работы осталась человеку; 130 — прервано (как у оболочек).
const EXIT_FAILED = 1
const EXIT_ATTENTION = 2
const EXIT_INTERRUPTED = 130

class Interrupted extends Error {}

// Ctrl+C получают и дочерние процессы, и скрипт: дочерний процесс завершается, а скрипт откатывает изменения.
// Повторный сигнал завершает скрипт сразу; снимок на диске восстановится при следующем запуске.
let interrupted = false
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
  process.on(signal, () => {
    if (interrupted) process.exit(EXIT_INTERRUPTED)
    interrupted = true
  })
}

/** Выполняет команду; quiet скрывает обычный вывод, но оставляет ошибки. */
async function run(command: string, { cwd, quiet = false }: { cwd?: string; quiet?: boolean } = {}) {
  const code = await new Promise<null | number>((resolve, reject) => {
    spawn(command, { cwd, shell: true, stdio: quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit' })
      .on('error', reject)
      .on('close', resolve)
  })
  if (interrupted) throw new Interrupted('Прервано пользователем.')
  if (code !== 0) throw new Error(`Команда завершилась с кодом ${String(code)}: ${command}`)
}

/** Возвращает результат команды; вызывающий код решает, допустим ли ненулевой код возврата. */
const captureResult = (command: string) => {
  const result = spawnSync(command, { encoding: 'utf8', shell: true })
  if (result.error) throw result.error
  return result
}

/** Возвращает вывод команды независимо от кода возврата. */
const capture = (command: string) => captureResult(command).stdout.trim()

const quote = (value: string) => `"${value}"`

async function succeeds(command: string) {
  try {
    await run(command)
    return true
  } catch (error) {
    if (error instanceof Interrupted) throw error
    return false
  }
}

async function withTempDir<T>(action: (dir: string) => Promise<T>): Promise<T> {
  const dir = mkdtempSync(join(tmpdir(), 'deps-update-'))
  try {
    return await action(dir)
  } finally {
    rmSync(dir, { force: true, recursive: true })
  }
}

const readManifest = (path = 'package.json') => parseManifest(readFileSync(path, 'utf8'))

const writeManifest = (manifest: Manifest) => {
  writeFileSync('package.json', `${JSON.stringify(manifest, null, 2)}\n`)
}

const readNvmrcMajor = () => major(readFileSync('.nvmrc', 'utf8').trim())

const snapshot = (): Snapshot => FILES.map((file) => [file, readFileSync(file, 'utf8')])

async function checksPass() {
  return withTempDir(
    async (dir) =>
      (await succeeds('pnpm check')) && succeeds(`pnpm exec vite build --outDir ${quote(dir)} --emptyOutDir`),
  )
}

/** Обновление должно быть отдельным изменением: незакоммиченные правки в тех же файлах смешались бы с ним. */
function ensureCleanGit() {
  if (capture('git rev-parse --is-inside-work-tree') !== 'true') {
    console.warn('Проект не в git: изменения после обновления не с чем сравнить.')
    return
  }
  if (capture(`git status --porcelain --untracked-files=no -- ${FILES.join(' ')}`)) {
    throw new Error(`В ${FILES.join(', ')} есть незакоммиченные изменения: закоммить или отмени их.`)
  }
}

/** Последняя LTS-версия Node.js или undefined, если nodejs.org недоступен. */
async function fetchNodeLts() {
  try {
    const response = await fetch('https://nodejs.org/dist/index.json', { signal: AbortSignal.timeout(15_000) })
    return latestLts((await response.json()) as NodeRelease[])
  } catch {
    return undefined
  }
}

/** Диапазоны версий из только что созданного проекта Vite. */
async function loadTemplateRanges(): Promise<Ranges> {
  const ranges = await withTempDir(async (dir) => {
    // Тот же путь, что у человека: официальный CLI без вопросов и без установки зависимостей.
    await run(`pnpm create vite@latest app --template ${TEMPLATE} --no-interactive --no-immediate`, {
      cwd: dir,
      quiet: true,
    })
    const manifest = readManifest(join(dir, 'app', 'package.json'))
    return { ...manifest.dependencies, ...manifest.devDependencies }
  })
  if (!('react' in ranges && 'vite' in ranges)) {
    throw new Error(`В шаблоне create-vite ${TEMPLATE} не найдены react и vite.`)
  }
  return ranges
}

/** Пакеты, у которых latest вне диапазона. */
// pnpm outdated возвращает код 1 при наличии устаревших пакетов; пустой вывод с ошибкой — не пустой список.
const outdated = () => {
  const result = captureResult('pnpm outdated --format json')
  return parseOutdated(result.stdout, result.status)
}

function restoreInterruptedRun() {
  if (!existsSync(BACKUP)) return
  const saved = JSON.parse(readFileSync(BACKUP, 'utf8')) as Snapshot
  const current = snapshot()
  console.warn('Предыдущий запуск был прерван — восстанавливаем файлы из его снимка.')
  // После прерванного запуска файлы могли поправить вручную: сохраняем их текущие версии, чтобы правки не пропали.
  if (JSON.stringify(current) !== JSON.stringify(saved)) {
    writeFileSync(REPLACED, JSON.stringify(current, null, 2))
    console.warn(`Текущие версии ${FILES.join(', ')} сохранены в ${REPLACED}.`)
  }
  restore(saved, { backup: BACKUP })
}

/** Применяет обновление; если оно или проверки падают, откатывает его. */
async function tryUpdate({ apply, label }: Candidate) {
  const saved = snapshot()
  console.log(`\n→ Пробуем: ${label}`)
  try {
    await apply()
    if (await verify()) return true
  } catch (error) {
    if (error instanceof Interrupted) throw error
    // Причина видна в выводе команды, но ошибки самого скрипта («pnpm не нашёл Node.js 26») иначе не показались бы.
    console.warn(error instanceof Error ? error.message : error)
  }
  restore(saved)
  return false
}

/**
 * Проверки проекта и сборка во временный каталог, чтобы не трогать dist. Упавшая проверка повторяется один раз:
 * browser-тест может упасть, когда Vite перезагружается после новой зависимости (см. «Тесты» в CLAUDE.md).
 */
async function verify() {
  if (await checksPass()) return true
  console.warn('\nПроверки не прошли — повторяем один раз, чтобы исключить нестабильный сбой.')
  return checksPass()
}

/** Записывает снимок через временный файл: прерывание во время записи не оставит битый снимок. */
function writeBackup(saved: Snapshot) {
  mkdirSync(dirname(BACKUP), { recursive: true })
  writeFileSync(`${BACKUP}.tmp`, JSON.stringify(saved))
  renameSync(`${BACKUP}.tmp`, BACKUP)
}

const packagesCandidate = (names: string[]): Candidate => ({
  apply: () => run(`pnpm update --latest ${names.map(quote).join(' ')}`),
  label: names.join(', '),
})

/** Пробует мажорные обновления пакетов: все вместе, затем группами, затем по одному. Возвращает непрошедшие. */
async function updatePackageMajors(packages: Record<string, Outdated>) {
  const groups = groupRelated(packages)
  if (groups.length === 0 || (groups.length > 1 && (await tryUpdate(packagesCandidate(Object.keys(packages)))))) {
    return []
  }
  const skipped: string[] = []
  for (const group of groups) {
    if (await tryUpdate(packagesCandidate(group))) continue
    for (const name of group.length > 1 ? group : []) {
      if (!(await tryUpdate(packagesCandidate([name])))) skipped.push(name)
    }
    if (group.length === 1) skipped.push(...group)
  }
  return skipped.map((name) => `${name}: ${packages[name].current} → ${packages[name].latest} — latest ломает проверки`)
}

const pnpmCandidate = (version: string): Candidate => ({
  apply: async () => {
    writeManifest({ ...readManifest(), packageManager: `pnpm@${version}` })
    // pnpm сам переключается на версию из packageManager.
    await run('pnpm install')
  },
  failure: 'latest ломает проверки (вывод выше)',
  label: `pnpm ${version}`,
  success: 'обнови упоминания версии в CLAUDE.md',
})

// pnpm берёт версию Node.js для `pnpm exec node` из .nvmrc, но pnpm install и pnpm check не падают, если такой
// версии нет, и выполняют проверки на текущей. Поэтому сначала убеждаемся, что pnpm действительно получает новую версию.
const nodeCandidate = (ltsMajor: number, templateRanges: Ranges): Candidate => ({
  apply: async () => {
    writeFileSync('.nvmrc', `${String(ltsMajor)}\n`)
    if (nodeMajorFromOutput(capture('pnpm exec node --version')) !== ltsMajor) {
      throw new Error(`pnpm не нашёл Node.js ${String(ltsMajor)}.`)
    }
    // @types/node вне шаблона переходит на новую версию вместе с .nvmrc.
    const { manifest } = pinRanges(readManifest(), templateRanges, ltsMajor)
    writeManifest({ ...manifest, engines: { ...manifest.engines, node: `>=${String(ltsMajor)}.0.0` } })
    await run('pnpm install')
  },
  failure: `не установлен или ломает проверки (вывод выше): установи Node.js ${String(ltsMajor)} и запусти обновление снова`,
  label: `Node.js ${String(ltsMajor)} LTS (.nvmrc, engines)`,
  success: 'обнови упоминания версии в CLAUDE.md',
})

async function main() {
  const release = acquireUpdateLock(LOCK)
  try {
    return await runUpdate()
  } finally {
    release()
  }
}

async function runUpdate() {
  restoreInterruptedRun()
  ensureCleanGit()
  const [templateRanges, nodeLts] = await Promise.all([loadTemplateRanges(), fetchNodeLts()])
  const pnpm = planPnpm(readManifest().packageManager, capture('pnpm view pnpm version'))

  const original = snapshot()
  writeBackup(original)
  // attention — то, что человеку нужно сделать (код 2); notes — справка без действий.
  const attention: string[] = []
  const notes: string[] = []
  if (pnpm.kind === 'unknown') attention.push('Не удалось узнать последнюю версию pnpm: pnpm оставлен как есть.')
  try {
    const { manifest, pinned } = pinRanges(readManifest(), templateRanges, readNvmrcMajor())
    writeManifest(pnpm.kind === 'minor' ? { ...manifest, packageManager: `pnpm@${pnpm.version}` } : manifest)
    console.log('Закреплённые диапазоны:', pinned.map(({ name, range }) => `${name}@${range}`).join(', '))
    const names = pinned.map(({ name }) => name)
    await run('pnpm install')
    // Закреплённые пакеты — в пределах диапазона; --no-save сохраняет диапазон в package.json.
    // Без имён pnpm update обновил бы все пакеты, поэтому пустой список пропускаем.
    if (names.length > 0) await run(`pnpm update --no-save ${names.map(quote).join(' ')}`)
    // Остальные — в пределах своих диапазонов (minor/patch).
    await run(`pnpm update ${names.map((name) => quote('!' + name)).join(' ')}`)
    if (!(await verify())) throw new Error('Проверки не прошли уже после обновлений в пределах диапазонов.')

    const all = outdated()
    notes.push(...describeLag(all, pinned))
    attention.push(...(await updatePackageMajors(majorCandidates(all, pinned))))

    await updateTools({ attention, nodeLts, notes, pnpm, templateRanges })
  } catch (error) {
    restore(original, { backup: BACKUP })
    if (error instanceof Interrupted) {
      console.error('\nПрервано: package.json, pnpm-lock.yaml и .nvmrc восстановлены.')
      return EXIT_INTERRUPTED
    }
    console.error('\nОбновление отменено, package.json, pnpm-lock.yaml и .nvmrc восстановлены.', error)
    return EXIT_FAILED
  }
  rmSync(BACKUP)

  console.log('\nГотово: pnpm check и vite build проходят.')
  if (notes.length > 0) console.log(['Для справки:', ...notes.map((note) => `  - ${note}`)].join('\n'))
  if (attention.length === 0) return 0
  console.warn(['Требует внимания:', ...attention.map((item) => `  - ${item}`)].join('\n'))
  return EXIT_ATTENTION
}

/** Пробует новые мажорные версии pnpm и Node.js; итог дописывает в attention (действия человека) и notes (справка). */
async function updateTools(context: {
  attention: string[]
  nodeLts: string | undefined
  notes: string[]
  pnpm: PnpmPlan
  templateRanges: Ranges
}) {
  const { attention, nodeLts, notes, pnpm, templateRanges } = context
  const candidates: Candidate[] = pnpm.kind === 'major' ? [pnpmCandidate(pnpm.version)] : []
  const node = planNode(nodeLts, readNvmrcMajor(), process.versions.node)
  if (node.kind === 'unknown') attention.push('Не удалось узнать LTS-версию Node.js: nodejs.org недоступен.')
  if (node.kind === 'patch') notes.push(`Доступен Node.js ${node.version}, установлен ${process.versions.node}.`)
  if (node.kind === 'major') candidates.push(nodeCandidate(node.major, templateRanges))
  for (const candidate of candidates) {
    const message = (await tryUpdate(candidate)) ? candidate.success : candidate.failure
    if (message) attention.push(`${candidate.label}: ${message}`)
  }
}

try {
  process.exitCode = await main()
} catch (error) {
  // При ошибке отката backup остаётся на диске для повторного запуска.
  console.error(error instanceof Error ? error.message : error)
  if (existsSync(BACKUP))
    console.error(`Резервная копия сохранена в ${BACKUP}; повтори запуск после устранения ошибки.`)
  process.exitCode = error instanceof Interrupted ? EXIT_INTERRUPTED : EXIT_FAILED
}
