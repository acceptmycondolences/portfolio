// Чистая логика обновления зависимостей: без команд, файлов и сети, поэтому покрыта unit-тестами (plan.test.ts).
// Побочные эффекты и порядок шагов — в main.ts.

export interface Manifest {
  dependencies?: Ranges
  devDependencies?: Ranges
  engines?: Ranges
  packageManager?: string
}

export type NodePlan =
  { kind: 'current' } | { kind: 'major'; major: number } | { kind: 'patch'; version: string } | { kind: 'unknown' }

export interface NodeRelease {
  lts: false | string
  version: string
}

export interface Outdated {
  current: string
  latest: string
}

/** Пакет, диапазон которого задаёт не реестр, а шаблон Vite или .nvmrc. */
export interface Pinned {
  name: string
  range: string
  source: 'nvmrc' | 'template'
}

export type PnpmPlan =
  { kind: 'current' } | { kind: 'major'; version: string } | { kind: 'minor'; version: string } | { kind: 'unknown' }

export type Ranges = Record<string, string>

// Типы Node.js должны соответствовать версии из .nvmrc, а не latest из реестра.
const NODE_TYPES = '@types/node'

/** Мажорная версия из версии или диапазона: 24.22.0, v26.1.0, ^19.2.8, >=24.0.0. NaN, если числа нет. */
export const major = (version: string) => Number.parseInt(version.replace(/^\D+/, ''), 10)

/** Разбирает 6.0.0-beta.1 на числа [6, 0, 0] и пре-релиз beta.1. */
const parseVersion = (version: string) => {
  const [core, ...prerelease] = version.split('-')
  return { core: core.split('.').map(Number), prerelease: prerelease.join('-') }
}

/**
 * Сравнивает версии по semver: числа — как числа, а не как строки; пре-релиз младше релиза с теми же числами
 * (5.0.0-beta.1 < 5.0.0), пре-релизы между собой — по частям с числовым сравнением.
 */
export function isOlder(version: string, than: string) {
  const [a, b] = [parseVersion(version), parseVersion(than)]
  const index = a.core.findIndex((part, i) => part !== b.core[i])
  if (index !== -1) return a.core[index] < b.core[index]
  if (!a.prerelease || !b.prerelease) return Boolean(a.prerelease) && !b.prerelease
  return a.prerelease.localeCompare(b.prerelease, 'en', { numeric: true }) < 0
}

// BOM, который добавляют некоторые редакторы и PowerShell на Windows, JSON.parse не принимает; trimStart его убирает.
export const parseManifest = (text: string) => JSON.parse(text.trimStart()) as Manifest

/** Семейство пакета: vitest и @vitest/*, eslint и @eslint/*, tailwindcss и @tailwindcss/*. */
const familyOf = (name: string) => (name.startsWith('@') ? name.slice(1, name.indexOf('/')) : name)

/**
 * Объединяет пакеты, которые, вероятно, нужно обновлять вместе: одно семейство или одна линейка выпусков —
 * одинаковые текущая и latest-версии (eslint-plugin-react-x и eslint-plugin-react-dom). Совпадение одной только
 * latest-версии случайно и группы не образует. Связи транзитивны.
 */
export function groupRelated(packages: Record<string, Outdated>): string[][] {
  let groups: { keys: Set<string>; names: string[] }[] = []
  for (const [name, { current, latest }] of Object.entries(packages)) {
    const keys = [`family:${familyOf(name)}`, `release:${current}→${latest}`]
    const related = groups.filter((group) => keys.some((key) => group.keys.has(key)))
    groups = groups.filter((group) => !related.includes(group))
    groups.push({
      keys: new Set([...keys, ...related.flatMap((group) => [...group.keys])]),
      names: [...related.flatMap((group) => group.names), name],
    })
  }
  return groups.map((group) => group.names)
}

/**
 * Разбирает `pnpm outdated --format json`: код 1 допустим только вместе с результатом. Пакеты без current
 * (не установлены) или latest пропускаются: сравнивать нечего, а без пропуска откатился бы весь прогон.
 */
export function parseOutdated(stdout: string, status: null | number = 0): Record<string, Outdated> {
  if (status !== 0 && (status !== 1 || !stdout.trim())) {
    throw new Error(`pnpm outdated завершился с кодом ${String(status)}`)
  }
  if (!stdout.trim()) return {}
  const entries = Object.entries(JSON.parse(stdout) as Record<string, Partial<Outdated>>)
  return Object.fromEntries(
    entries.flatMap(([name, { current, latest }]) => (current && latest ? [[name, { current, latest }]] : [])),
  )
}

/**
 * Задаёт диапазоны, которые не берутся из реестра: пакеты шаблона Vite получают его диапазоны (пакеты шаблона,
 * которых нет в проекте, например oxlint, не добавляются); @types/node вне шаблона следует мажорной версии .nvmrc.
 * Исходный manifest не меняется.
 */
export function pinRanges(manifest: Manifest, templateRanges: Ranges, nodeMajor: number) {
  const result = structuredClone(manifest)
  const pinned: Pinned[] = []
  for (const deps of [result.dependencies ?? {}, result.devDependencies ?? {}]) {
    for (const [name, range] of Object.entries(deps)) {
      if (name in templateRanges) {
        deps[name] = templateRanges[name]
        pinned.push({ name, range: deps[name], source: 'template' })
      } else if (name === NODE_TYPES) {
        deps[name] = major(range) === nodeMajor ? range : `^${String(nodeMajor)}.0.0`
        pinned.push({ name, range: deps[name], source: 'nvmrc' })
      }
    }
  }
  return { manifest: result, pinned }
}

/**
 * Пакеты для обновления за пределами диапазона: не закреплённые и действительно старше latest. pnpm outdated
 * показывает и пакеты с пре-релизом новее latest (6.0.0-beta при latest 5.4.0) — `update --latest` понизил бы их.
 */
export const majorCandidates = (outdated: Record<string, Outdated>, pinned: Pinned[]) =>
  Object.fromEntries(
    Object.entries(outdated).filter(
      ([name, { current, latest }]) => !pinned.some((item) => item.name === name) && isOlder(current, latest),
    ),
  )

/** Закреплённые пакеты, у которых в реестре есть версия вне диапазона: сообщаем, но не обновляем. */
export const describeLag = (outdated: Record<string, Outdated>, pinned: Pinned[]) =>
  pinned
    .filter(({ name }) => name in outdated)
    .map(({ name, range, source }) => {
      const reason = source === 'template' ? 'обновится вместе с шаблоном Vite' : 'обновится вместе с .nvmrc'
      return `${name}: ${range}, в реестре ${outdated[name].latest} — ${reason}`
    })

/** Последняя LTS-версия без префикса v из https://nodejs.org/dist/index.json (выпуски от новых к старым). */
export const latestLts = (releases: NodeRelease[]) =>
  releases.find((release) => release.lts !== false)?.version.slice(1)

/**
 * Мажорная версия из вывода `node --version`. Сообщение pnpm об отсутствующей версии
 * («Node.js v26.12.0 is not installed…») тоже содержит номер, поэтому число берётся только из строки вида v26.12.0.
 */
export const nodeMajorFromOutput = (stdout: string) => {
  const match = /^v(\d+)\.\d+\.\d+$/.exec(stdout.trim())
  return match ? Number(match[1]) : undefined
}

/** Новая мажорная LTS-версия — кандидат на обновление .nvmrc; более новый патч только сообщается. */
export function planNode(lts: string | undefined, projectMajor: number, running: string): NodePlan {
  if (!lts) return { kind: 'unknown' }
  if (major(lts) > projectMajor) return { kind: 'major', major: major(lts) }
  return isOlder(running, lts) ? { kind: 'patch', version: lts } : { kind: 'current' }
}

/** Версия pnpm из packageManager (pnpm@12.13.0 или pnpm@12.13.0+sha512.…); без поля pnpm не управляем. */
export function planPnpm(packageManager: string | undefined, latest: string): PnpmPlan {
  if (!latest) return { kind: 'unknown' }
  if (!packageManager?.startsWith('pnpm@')) return { kind: 'current' }
  const current = packageManager.slice('pnpm@'.length).split('+')[0]
  if (major(latest) > major(current)) return { kind: 'major', version: latest }
  return major(latest) === major(current) && isOlder(current, latest)
    ? { kind: 'minor', version: latest }
    : { kind: 'current' }
}
