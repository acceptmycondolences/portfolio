import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it as baseIt, describe, expect } from 'vitest'

import { restore } from './recovery.ts'

const saved = [
  ['package.json', '{"version":"before"}\n'],
  ['pnpm-lock.yaml', 'before\n'],
  ['.nvmrc', '24\n'],
] as const

const it = baseIt.extend<{ dir: string }>({
  dir: async ({ task }, provide) => {
    const dir = mkdtempSync(join(tmpdir(), 'deps-update-recovery-test-' + task.id.replace(/[^a-z0-9]/gi, '') + '-'))
    try {
      for (const [file] of saved) writeFileSync(join(dir, file), 'after\n')
      writeFileSync(join(dir, 'backup.json'), 'backup')
      await provide(dir)
    } finally {
      rmSync(dir, { force: true, recursive: true })
    }
  },
})

describe('restore', () => {
  it('оставляет резервную копию, если повторная установка не прошла', ({ dir }) => {
    expect(() => {
      restore(saved, {
        backup: 'backup.json',
        cwd: dir,
        installCommand: `"${process.execPath}" -e "process.exit(7)"`,
      })
    }).toThrow('Команда завершилась с кодом 7')

    for (const [file, content] of saved) expect(readFileSync(join(dir, file), 'utf8')).toBe(content)
    expect(readFileSync(join(dir, 'backup.json'), 'utf8')).toBe('backup')
  })

  it('удаляет резервную копию после успешного восстановления', ({ dir }) => {
    restore(saved, {
      backup: 'backup.json',
      cwd: dir,
      installCommand: `"${process.execPath}" -e "process.exit(0)"`,
    })

    for (const [file, content] of saved) expect(readFileSync(join(dir, file), 'utf8')).toBe(content)
    expect(existsSync(join(dir, 'backup.json'))).toBe(false)
  })
})
