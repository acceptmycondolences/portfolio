import { spawnSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type Snapshot = readonly (readonly [file: string, content: string])[]

interface RestoreOptions {
  backup?: string
  cwd?: string
  installCommand?: string
}

/** Восстанавливает файлы и зависимости; backup удаляется только после успешной установки. */
export function restore(
  saved: Snapshot,
  { backup, cwd = process.cwd(), installCommand = 'pnpm install' }: RestoreOptions = {},
) {
  for (const [file, content] of saved) writeFileSync(join(cwd, file), content)

  const result = spawnSync(installCommand, { cwd, shell: true, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`Команда завершилась с кодом ${String(result.status)}: ${installCommand}`)
  }

  if (backup) rmSync(join(cwd, backup))
}
