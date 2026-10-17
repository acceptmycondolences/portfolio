import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it as baseIt, describe, expect } from 'vitest'

import { acquireUpdateLock } from './lock.ts'

const it = baseIt.extend<{ lockPath: string }>({
  lockPath: async ({ task }, provide) => {
    const dir = mkdtempSync(join(tmpdir(), 'deps-update-lock-test-' + task.id.replace(/[^a-z0-9]/gi, '') + '-'))
    try {
      await provide(join(dir, 'update.lock'))
    } finally {
      rmSync(dir, { force: true, recursive: true })
    }
  },
})

describe('acquireUpdateLock', () => {
  it('не допускает второй запуск, пока первый удерживает блокировку', ({ lockPath: path }) => {
    const release = acquireUpdateLock(path)
    try {
      expect(() => acquireUpdateLock(path)).toThrow('Обновление зависимостей уже выполняется')
      expect(existsSync(path)).toBe(true)
    } finally {
      release()
    }
  })

  it('разрешает новый запуск после завершения первого', ({ lockPath: path }) => {
    acquireUpdateLock(path)()
    const release = acquireUpdateLock(path)
    release()
    expect(existsSync(path)).toBe(false)
  })

  it('объясняет восстановление, если после аварии остался файл блокировки', ({ lockPath: path }) => {
    writeFileSync(path, '12345\n')
    expect(() => acquireUpdateLock(path)).toThrow(`Убедись, что обновление не выполняется, затем удали ${path}`)
    expect(existsSync(path)).toBe(true)
  })

  it('оставляет блокировку при принудительном выходе, пока дочерняя команда ещё может работать', ({
    lockPath: path,
  }) => {
    const script = `import { acquireUpdateLock } from ${JSON.stringify(new URL('./lock.ts', import.meta.url).href)}; acquireUpdateLock(${JSON.stringify(path)}); process.exit(130)`
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], { encoding: 'utf8' })
    expect(result.status).toBe(130)
    expect(existsSync(path)).toBe(true)
  })
})
