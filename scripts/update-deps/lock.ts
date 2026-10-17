import { closeSync, mkdirSync, openSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** Атомарно блокирует запуск; оставшийся после аварии файл удаляется вручную. */
export function acquireUpdateLock(path: string): () => void {
  mkdirSync(dirname(path), { recursive: true })
  let descriptor: number
  try {
    descriptor = openSync(path, 'wx')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new Error(
        `Обновление зависимостей уже выполняется или осталось после аварии. Убедись, что обновление не выполняется, затем удали ${path}.`,
        { cause: error },
      )
    }
    throw error
  }

  try {
    writeFileSync(descriptor, `${String(process.pid)}\n`)
  } catch (error) {
    closeSync(descriptor)
    rmSync(path)
    throw error
  }
  closeSync(descriptor)

  let released = false
  const release = () => {
    if (released) return
    released = true
    rmSync(path)
  }
  return release
}
