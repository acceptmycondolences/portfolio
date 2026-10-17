// Подменяем только внешние команды и сеть в отдельном процессе теста main.ts.
// Файлы, блокировка, резервная копия и алгоритм обновления остаются настоящими.
import childProcess from 'node:child_process'
import { EventEmitter } from 'node:events'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { join } from 'node:path'

import { http, HttpResponse } from 'msw/http'
import { setupServer } from 'msw/node'

const scenario = JSON.parse(readFileSync('scenario.json', 'utf8'))
const gitStatus = scenario.dirty ? ' M package.json' : ''
let checks = 0

function checkProject() {
  checks++
  const deps = manifest().dependencies
  const broken = (scenario.failMajors ?? []).some((name) => deps[name] === scenario.outdated[name].latest)
  return { status: checks <= (scenario.failChecks ?? 0) || broken ? 1 : 0 }
}

function execute(command, options = {}) {
  appendFileSync('commands.jsonl', JSON.stringify(command) + '\n')
  if (command === 'git rev-parse --is-inside-work-tree') return { stdout: 'true' }
  if (command.startsWith('git status')) return { stdout: gitStatus }
  if (command === 'pnpm view pnpm version') return { stdout: scenario.pnpm ?? '12.14.0' }
  if (command === 'pnpm exec node --version') return { stdout: scenario.nodeVersion ?? 'v24.22.0' }
  if (command === 'pnpm outdated --format json') {
    return { status: scenario.outdatedStatus ?? 0, stdout: JSON.stringify(scenario.outdated ?? {}) }
  }
  if (command.startsWith('pnpm create vite@latest')) {
    const app = join(options.cwd, 'app')
    mkdirSync(app)
    writeFileSync(join(app, 'package.json'), JSON.stringify({ dependencies: { react: '^19.0.0', vite: '^8.0.0' } }))
    return {}
  }
  if (command === 'pnpm check') return checkProject()
  if (command.startsWith('pnpm exec vite build')) return { status: scenario.failBuild ? 1 : 0 }
  if (command.startsWith('pnpm update')) return updatePackages(command)
  if (command === 'pnpm install') return { status: scenario.failInstall ? 1 : 0 }
  throw new Error(`Неожиданная внешняя команда: ${command}`)
}

function manifest() {
  return JSON.parse(readFileSync('package.json', 'utf8'))
}

function updatePackages(command) {
  writeFileSync('pnpm-lock.yaml', 'updated\n')
  if (command.startsWith('pnpm update --latest')) {
    const current = manifest()
    for (const [, name] of command.matchAll(/"([^"]+)"/g)) {
      current.dependencies[name] = scenario.outdated[name].latest
    }
    writeFileSync('package.json', JSON.stringify(current))
  }
  if (command === scenario.interruptOn) process.emit('SIGINT')
  return {}
}

childProcess.spawn = (command, options) => {
  const child = new EventEmitter()
  setImmediate(() => {
    try {
      child.emit('close', execute(command, options).status ?? 0)
    } catch (error) {
      child.emit('error', error)
    }
  })
  return child
}

childProcess.spawnSync = (command, options) => ({
  status: 0,
  stderr: '',
  stdout: '',
  ...execute(command, options),
})

const server = setupServer(
  http.get('https://nodejs.org/dist/index.json', () => {
    if (scenario.networkError) return HttpResponse.error()
    return HttpResponse.json([{ lts: 'Test', version: scenario.lts ?? 'v24.22.0' }])
  }),
)
server.listen({ onUnhandledFrame: 'error' })
process.once('exit', () => server.close())

syncBuiltinESMExports()
