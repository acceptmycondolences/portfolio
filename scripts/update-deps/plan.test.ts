import { describe, expect, it } from 'vitest'

import {
  describeLag,
  groupRelated,
  isOlder,
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
  type Outdated,
} from './plan.ts'

// Невидимый символ BOM строим из кода, чтобы он был заметен в исходнике.
const BOM = String.fromCodePoint(0xfe_ff)

const outdated = (current: string, latest: string): Outdated => ({ current, latest })

describe('plan', () => {
  describe('major', () => {
    it.for([
      ['24.22.0', 24],
      ['v26.1.0', 26],
      ['^19.2.8', 19],
      ['~6.0.2', 6],
      ['>=24.0.0', 24],
    ] as const)('берёт мажорную версию из %s', ([version, expected]) => {
      expect(major(version)).toBe(expected)
    })

    it('возвращает NaN для пустой строки', () => {
      expect(major('')).toBeNaN()
    })
  })

  describe('isOlder', () => {
    it.for([
      ['24.21.0', '24.22.0', true],
      ['9.0.0', '10.0.0', true],
      ['24.9.0', '24.10.0', true],
      ['24.22.0', '24.22.0', false],
      ['24.10.0', '24.9.0', false],
      ['25.0.0', '24.22.0', false],
      ['5.0.0-beta.1', '5.0.0', true],
      ['5.0.0-beta.2', '5.0.0-beta.10', true],
      ['5.0.0-rc.1', '5.0.0-beta.2', false],
      ['5.0.0', '5.0.0-beta.1', false],
      ['6.0.0-beta', '5.4.0', false],
    ] as const)('%s ниже %s: %s', ([version, than, expected]) => {
      expect(isOlder(version, than)).toBe(expected)
    })
  })

  describe('parseManifest', () => {
    it('читает package.json с BOM', () => {
      expect(parseManifest(BOM + '{ "packageManager": "pnpm@12.14.0" }')).toStrictEqual({
        packageManager: 'pnpm@12.14.0',
      })
    })
  })

  describe('groupRelated', () => {
    it('объединяет пакет с его скоупом и пакеты одного скоупа', () => {
      expect(
        groupRelated({
          '@tanstack/react-router': outdated('1.170.44', '2.0.0'),
          '@tanstack/router-plugin': outdated('1.168.46', '2.1.0'),
          '@vitest/coverage-v8': outdated('5.0.4', '6.0.1'),
          vitest: outdated('5.0.4', '6.0.0'),
        }),
      ).toStrictEqual([
        ['@tanstack/react-router', '@tanstack/router-plugin'],
        ['@vitest/coverage-v8', 'vitest'],
      ])
    })

    it('объединяет пакеты одной линейки выпусков без общего скоупа', () => {
      expect(
        groupRelated({
          'eslint-plugin-react-dom': outdated('5.27.2', '6.0.0'),
          'eslint-plugin-react-x': outdated('5.27.2', '6.0.0'),
        }),
      ).toStrictEqual([['eslint-plugin-react-dom', 'eslint-plugin-react-x']])
    })

    it('не объединяет несвязанные пакеты со случайно совпавшей latest-версией', () => {
      expect(
        groupRelated({
          '@tanstack/react-router': outdated('1.170.44', '2.0.0'),
          '@vitest/eslint-plugin': outdated('1.6.27', '2.0.0'),
        }),
      ).toStrictEqual([['@tanstack/react-router'], ['@vitest/eslint-plugin']])
    })

    it('объединяет группы транзитивно', () => {
      // a и b — одно семейство, b и c — одна линейка выпусков, значит a, b и c обновляются вместе.
      expect(
        groupRelated({
          '@scope/a': outdated('1.0.0', '2.0.0'),
          c: outdated('3.0.0', '4.0.0'),
          scope: outdated('3.0.0', '4.0.0'),
        }),
      ).toStrictEqual([['@scope/a', 'c', 'scope']])
    })

    it('возвращает пустой список без пакетов', () => {
      expect(groupRelated({})).toStrictEqual([])
    })
  })

  describe('pinRanges', () => {
    const template = { '@types/node': '^24.13.3', react: '^19.2.8', vite: '^8.3.0' }

    it('задаёт пакетам шаблона его диапазоны и не добавляет отсутствующие в проекте', () => {
      const manifest: Manifest = {
        dependencies: { clsx: '^2.1.1', react: '^19.3.0' },
        devDependencies: { vite: '^8.3.4' },
      }

      expect(pinRanges(manifest, { ...template, oxlint: '^1.81.0' }, 24)).toStrictEqual({
        manifest: { dependencies: { clsx: '^2.1.1', react: '^19.2.8' }, devDependencies: { vite: '^8.3.0' } },
        pinned: [
          { name: 'react', range: '^19.2.8', source: 'template' },
          { name: 'vite', range: '^8.3.0', source: 'template' },
        ],
      })
    })

    it('берёт диапазон @types/node из шаблона, даже если он расходится с .nvmrc', () => {
      expect(pinRanges({ devDependencies: { '@types/node': '^22.0.0' } }, template, 22).pinned).toStrictEqual([
        { name: '@types/node', range: '^24.13.3', source: 'template' },
      ])
    })

    it('привязывает @types/node вне шаблона к мажорной версии .nvmrc', () => {
      expect(pinRanges({ devDependencies: { '@types/node': '^24.13.3' } }, {}, 26)).toStrictEqual({
        manifest: { devDependencies: { '@types/node': '^26.0.0' } },
        pinned: [{ name: '@types/node', range: '^26.0.0', source: 'nvmrc' }],
      })
    })

    it('оставляет диапазон @types/node вне шаблона, если мажорная версия совпадает с .nvmrc', () => {
      expect(pinRanges({ devDependencies: { '@types/node': '^24.13.3' } }, {}, 24).pinned).toStrictEqual([
        { name: '@types/node', range: '^24.13.3', source: 'nvmrc' },
      ])
    })

    it('не меняет исходный manifest', () => {
      const manifest: Manifest = { dependencies: { react: '^19.3.0' } }

      pinRanges(manifest, template, 24)

      expect(manifest).toStrictEqual({ dependencies: { react: '^19.3.0' } })
    })

    it('работает без полей зависимостей', () => {
      expect(pinRanges({}, template, 24)).toStrictEqual({ manifest: {}, pinned: [] })
    })
  })

  describe('parseOutdated', () => {
    it('оставляет current и latest и пропускает пакеты без них', () => {
      const stdout = JSON.stringify({
        globals: { current: '17.13.0', dependencyType: 'devDependencies', latest: '18.0.0', wanted: '17.13.0' },
        'not-installed': { dependencyType: 'dependencies', latest: '2.0.0', wanted: '2.0.0' },
      })

      expect(parseOutdated(stdout)).toStrictEqual({ globals: outdated('17.13.0', '18.0.0') })
    })

    it.for(['', '  \n'])('возвращает пустой объект для вывода %j', (stdout) => {
      expect(parseOutdated(stdout)).toStrictEqual({})
    })

    it('не считает ошибку команды без вывода отсутствием обновлений', () => {
      expect(() => parseOutdated('', 1)).toThrow('pnpm outdated завершился с кодом 1')
    })

    it('читает список обновлений при ожидаемом коде 1', () => {
      expect(parseOutdated('{"vite":{"current":"8.0.0","latest":"9.0.0"}}', 1)).toStrictEqual({
        vite: outdated('8.0.0', '9.0.0'),
      })
    })

    it('отвергает неожиданный код даже при наличии JSON', () => {
      expect(() => parseOutdated('{}', 2)).toThrow('pnpm outdated завершился с кодом 2')
    })
  })

  describe('majorCandidates', () => {
    it('берёт незакреплённые пакеты, которые старше latest, включая пре-релиз того же выпуска', () => {
      expect(
        majorCandidates(
          {
            globals: outdated('17.13.0', '18.0.0'),
            'lint-staged': outdated('18.0.0-beta.1', '18.0.0'),
            typescript: outdated('6.0.3', '7.0.2'),
          },
          [{ name: 'typescript', range: '~6.0.2', source: 'template' }],
        ),
      ).toStrictEqual({ globals: outdated('17.13.0', '18.0.0'), 'lint-staged': outdated('18.0.0-beta.1', '18.0.0') })
    })

    it('не понижает пакет с пре-релизом новее latest', () => {
      expect(majorCandidates({ vitest: outdated('6.0.0-beta.3', '5.4.0') }, [])).toStrictEqual({})
    })

    it('возвращает пустой объект без устаревших пакетов', () => {
      expect(majorCandidates({}, [])).toStrictEqual({})
    })
  })

  describe('describeLag', () => {
    it('сообщает о закреплённых пакетах с версией вне диапазона и указывает источник', () => {
      expect(
        describeLag(
          {
            '@types/node': outdated('24.19.2', '26.6.5'),
            eslint: outdated('10.12.0', '11.0.0'),
            typescript: outdated('6.0.3', '7.0.2'),
          },
          [
            { name: '@types/node', range: '^24.13.3', source: 'nvmrc' },
            { name: 'typescript', range: '~6.0.2', source: 'template' },
            { name: 'vite', range: '^8.3.0', source: 'template' },
          ],
        ),
      ).toStrictEqual([
        '@types/node: ^24.13.3, в реестре 26.6.5 — обновится вместе с .nvmrc',
        'typescript: ~6.0.2, в реестре 7.0.2 — обновится вместе с шаблоном Vite',
      ])
    })

    it('возвращает пустой список, если закреплённые пакеты не отстают', () => {
      expect(describeLag({}, [{ name: 'vite', range: '^8.3.0', source: 'template' }])).toStrictEqual([])
    })
  })

  describe('latestLts', () => {
    it('пропускает новые не-LTS-выпуски и убирает префикс v', () => {
      expect(
        latestLts([
          { lts: false, version: 'v26.12.0' },
          { lts: 'Krypton', version: 'v24.22.0' },
          { lts: 'Krypton', version: 'v24.21.0' },
        ]),
      ).toBe('24.22.0')
    })

    it('возвращает undefined без LTS-выпусков', () => {
      expect(latestLts([{ lts: false, version: 'v26.12.0' }])).toBeUndefined()
    })
  })

  describe('nodeMajorFromOutput', () => {
    it('берёт мажорную версию из вывода node --version', () => {
      expect(nodeMajorFromOutput('v26.12.0\n')).toBe(26)
    })

    it.for(['Node.js v26.12.0 is not installed or cannot be found.', ''])('не считает версией вывод %j', (stdout) => {
      expect(nodeMajorFromOutput(stdout)).toBeUndefined()
    })
  })

  describe('planNode', () => {
    it('предлагает обновление, когда вышла новая мажорная LTS', () => {
      expect(planNode('26.1.0', 24, '24.22.0')).toStrictEqual({ kind: 'major', major: 26 })
    })

    it('сообщает о новом патче той же мажорной версии', () => {
      expect(planNode('24.22.0', 24, '24.21.0')).toStrictEqual({ kind: 'patch', version: '24.22.0' })
    })

    it.for(['24.22.0', '24.23.0'])('ничего не предлагает, если установлен Node.js %s', (running) => {
      expect(planNode('24.22.0', 24, running)).toStrictEqual({ kind: 'current' })
    })

    it('сообщает, что LTS-версия неизвестна', () => {
      expect(planNode(undefined, 24, '24.22.0')).toStrictEqual({ kind: 'unknown' })
    })
  })

  describe('planPnpm', () => {
    it.for([
      ['pnpm@12.13.0', '12.14.0', { kind: 'minor', version: '12.14.0' }],
      ['pnpm@12.13.0+sha512.abc', '12.14.0', { kind: 'minor', version: '12.14.0' }],
      ['pnpm@12.14.0', '13.0.0', { kind: 'major', version: '13.0.0' }],
      ['pnpm@12.14.0', '12.14.0', { kind: 'current' }],
      ['pnpm@12.15.0-rc.1', '12.14.0', { kind: 'current' }],
      [undefined, '12.14.0', { kind: 'current' }],
      ['yarn@4.0.0', '12.14.0', { kind: 'current' }],
      ['pnpm@12.13.0', '', { kind: 'unknown' }],
    ] as const)('packageManager %s, latest %j', ([packageManager, latest, expected]) => {
      expect(planPnpm(packageManager, latest)).toStrictEqual(expected)
    })
  })
})
