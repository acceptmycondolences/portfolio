import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { it as baseIt, describe, expect } from 'vitest'

import { parseManifest, type Outdated } from './plan.ts'
import type { Snapshot } from './recovery.ts'

interface Scenario {
  dirty?: boolean
  failBuild?: boolean
  failChecks?: number
  failInstall?: boolean
  failMajors?: string[]
  interruptOn?: string
  lts?: string
  networkError?: boolean
  nodeVersion?: string
  outdated?: Record<string, Outdated>
  outdatedStatus?: number
  pnpm?: string
}

const BACKUP = 'node_modules/.tmp/deps-update-backup.json'
const LOCK = 'node_modules/.tmp/deps-update.lock'
const REPLACED = 'node_modules/.tmp/deps-update-replaced.json'
const original: Snapshot = [
  [
    'package.json',
    JSON.stringify({
      dependencies: { '@scope/a': '^1.0.0', '@scope/b': '^1.0.0', beta: '^3.0.0', react: '^19.0.0' },
      engines: { node: '>=24.0.0' },
      packageManager: 'pnpm@12.14.0',
    }) + '\n',
  ],
  ['pnpm-lock.yaml', 'original\n'],
  ['.nvmrc', '24\n'],
]

const availableMajors: Record<string, Outdated> = {
  '@scope/a': { current: '1.0.0', latest: '2.0.0' },
  '@scope/b': { current: '1.0.0', latest: '2.0.0' },
  beta: { current: '3.0.0', latest: '4.0.0' },
}

const it = baseIt.extend<{
  project: {
    exists: (file: string) => boolean
    read: (file: string) => string
    run: (scenario?: Scenario) => { code: null | number; output: string }
    write: (file: string, content: string) => void
  }
}>({
  project: async ({ task }, provide) => {
    const cwd = mkdtempSync(join(tmpdir(), 'deps-update-main-test-' + task.id.replace(/[^a-z0-9]/gi, '') + '-'))
    const read = (file: string) => readFileSync(join(cwd, file), 'utf8')
    const exists = (file: string) => existsSync(join(cwd, file))
    const write = (file: string, content: string) => {
      mkdirSync(dirname(join(cwd, file)), { recursive: true })
      writeFileSync(join(cwd, file), content)
    }
    for (const [file, content] of original) write(file, content)
    try {
      await provide({
        exists,
        read,
        run: (scenario = {}) => {
          write('scenario.json', JSON.stringify(scenario))
          const result = spawnSync(
            process.execPath,
            [
              '--import',
              new URL('./testing/commands.js', import.meta.url).href,
              fileURLToPath(new URL('./main.ts', import.meta.url)),
            ],
            { cwd, encoding: 'utf8', timeout: 10000 },
          )
          if (result.error) throw result.error
          return { code: result.status, output: result.stdout + result.stderr }
        },
        write,
      })
    } finally {
      rmSync(cwd, { force: true, recursive: true })
    }
  },
})

describe('main', () => {
  it('завершает обновление и удаляет снимок и блокировку', ({ project }) => {
    expect(project.run().code).toBe(0)
    expect(project.read('pnpm-lock.yaml')).toBe('updated\n')
    expect(project.exists(BACKUP)).toBe(false)
    expect(project.exists(LOCK)).toBe(false)
  })

  it('повторяет упавшую проверку и сохраняет успешное обновление', ({ project }) => {
    const result = project.run({ failChecks: 1 })
    expect(result.code).toBe(0)
    expect(result.output).toContain('повторяем один раз')
    expect(project.read('pnpm-lock.yaml')).toBe('updated\n')
  })

  it('принимает совместимое общее обновление мажорных версий', ({ project }) => {
    const outdated = { '@scope/a': availableMajors['@scope/a'], beta: availableMajors.beta }
    expect(project.run({ outdated }).code).toBe(0)
    expect(parseManifest(project.read('package.json')).dependencies).toStrictEqual({
      '@scope/a': '2.0.0',
      '@scope/b': '^1.0.0',
      beta: '4.0.0',
      react: '^19.0.0',
    })
    expect(project.exists(BACKUP)).toBe(false)
  })

  it.for([
    { code: 0, pnpm: '12.15.0' },
    { code: 2, pnpm: '13.0.0' },
  ])('сохраняет совместимое обновление pnpm до $pnpm', ({ code, pnpm }, { project }) => {
    expect(project.run({ pnpm }).code).toBe(code)
    expect(parseManifest(project.read('package.json')).packageManager).toBe(`pnpm@${pnpm}`)
    expect(project.exists(BACKUP)).toBe(false)
  })

  it('обновляет nvmrc и engines при доступной новой LTS', ({ project }) => {
    expect(project.run({ lts: 'v26.1.0', nodeVersion: 'v26.1.0' }).code).toBe(2)
    expect(project.read('.nvmrc')).toBe('26\n')
    expect(parseManifest(project.read('package.json')).engines).toStrictEqual({ node: '>=26.0.0' })
    expect(project.exists(BACKUP)).toBe(false)
  })

  it.for([{ failChecks: 2 }, { failBuild: true }, { outdatedStatus: 2 }])(
    'восстанавливает все файлы после ошибки $failChecks $failBuild $outdatedStatus',
    (scenario, { project }) => {
      expect(project.run(scenario).code).toBe(1)
      for (const [file, content] of original) expect(project.read(file)).toBe(content)
      expect(project.exists(BACKUP)).toBe(false)
      expect(project.exists(LOCK)).toBe(false)
    },
  )

  it('отказывается менять незакоммиченные файлы', ({ project }) => {
    expect(project.run({ dirty: true }).code).toBe(1)
    for (const [file, content] of original) expect(project.read(file)).toBe(content)
    expect(project.exists(BACKUP)).toBe(false)
    expect(project.exists(LOCK)).toBe(false)
  })

  it('сохраняет успешные мажоры и откатывает несовместимый пакет после попыток группой', ({ project }) => {
    const result = project.run({ failMajors: ['@scope/b'], outdated: availableMajors })
    expect(result.code).toBe(2)
    expect(parseManifest(project.read('package.json')).dependencies).toStrictEqual({
      '@scope/a': '2.0.0',
      '@scope/b': '^1.0.0',
      beta: '4.0.0',
      react: '^19.0.0',
    })
    expect(result.output).toContain('@scope/b: 1.0.0 → 2.0.0 — latest ломает проверки')
    const commands: unknown[] = project
      .read('commands.jsonl')
      .trim()
      .split('\n')
      .map((line): unknown => JSON.parse(line))
    expect(commands).toContain('pnpm update --latest "@scope/a" "@scope/b" "beta"')
    expect(commands).toContain('pnpm update --latest "@scope/a" "@scope/b"')
    expect(commands).toContain('pnpm update --latest "@scope/a"')
    expect(project.exists(BACKUP)).toBe(false)
  })

  it('откатывает весь прогон при прерывании после успешного мажора', ({ project }) => {
    const result = project.run({
      failMajors: ['@scope/b'],
      interruptOn: 'pnpm update --latest "beta"',
      outdated: availableMajors,
    })
    expect(result.code).toBe(130)
    for (const [file, content] of original) expect(project.read(file)).toBe(content)
    expect(project.exists(BACKUP)).toBe(false)
    expect(project.exists(LOCK)).toBe(false)
  })

  it('сохраняет снимок при неудачной переустановке и восстанавливается следующим запуском', ({ project }) => {
    expect(project.run({ failInstall: true }).code).toBe(1)
    expect(JSON.parse(project.read(BACKUP))).toStrictEqual(original)
    project.write('pnpm-lock.yaml', 'manual edit\n')

    expect(project.run().code).toBe(0)
    expect(JSON.parse(project.read(REPLACED))).toContainEqual(['pnpm-lock.yaml', 'manual edit\n'])
    expect(project.exists(BACKUP)).toBe(false)
    expect(project.exists(LOCK)).toBe(false)
  })

  it('восстанавливает снимок прерванного запуска до проверки чистоты git', ({ project }) => {
    project.write(BACKUP, JSON.stringify(original))
    project.write('pnpm-lock.yaml', 'interrupted\n')
    const result = project.run({ dirty: true })
    expect(result.code).toBe(1)
    for (const [file, content] of original) expect(project.read(file)).toBe(content)
    expect(JSON.parse(project.read(REPLACED))).toContainEqual(['pnpm-lock.yaml', 'interrupted\n'])
    expect(project.exists(BACKUP)).toBe(false)
  })

  it('сообщает о недоступной сети без отмены успешного обновления пакетов', ({ project }) => {
    const result = project.run({ networkError: true, pnpm: '' })
    expect(result.code).toBe(2)
    expect(result.output).toContain('Не удалось узнать LTS-версию Node.js')
    expect(result.output).toContain('Не удалось узнать последнюю версию pnpm')
    expect(project.read('pnpm-lock.yaml')).toBe('updated\n')
  })

  it('откатывает новую LTS, если pnpm не нашёл требуемый Node.js', ({ project }) => {
    const result = project.run({ lts: 'v26.1.0' })
    expect(result.code).toBe(2)
    expect(result.output).toContain('pnpm не нашёл Node.js 26')
    expect(project.read('.nvmrc')).toBe('24\n')
    expect(parseManifest(project.read('package.json')).engines).toStrictEqual({ node: '>=24.0.0' })
  })
})
