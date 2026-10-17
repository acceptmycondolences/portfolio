import js from '@eslint/js'
import pluginRouter from '@tanstack/eslint-plugin-router'
import vitest from '@vitest/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import perfectionist from 'eslint-plugin-perfectionist'
import reactDom from 'eslint-plugin-react-dom'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactX from 'eslint-plugin-react-x'
import sonarjs from 'eslint-plugin-sonarjs'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Дополнение: глобальные объекты, которые есть только в браузере, а в Node.js отсутствуют (document, window и т. п.).
const browserOnlyGlobals = Object.keys(globals.browser).filter((name) => !(name in globals.node))

// Основа — ESLint-конфигурация Vite React + TypeScript; ниже добавлены плагины и проверка с учётом типов.
// Пометка «Дополнение:» означает, что этого нет в шаблоне Vite; комментарии без пометки описывают настройки из шаблона.
export default defineConfig([
  // Дополнение: исключаем отчёты покрытия Vitest, dist из шаблона Vite и генерируемое дерево маршрутов.
  globalIgnores(['coverage', 'dist', '**/generatedRouteTree.ts']),
  // Дополнение: базовые правила ESLint применяем ко всем файлам, а не только к TS, чтобы проверялись и JS-конфиги.
  js.configs.recommended,
  {
    // Дополнение: JS-файлы в проекте — конфигурации инструментов, они выполняются в Node.js.
    files: ['**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Дополнение: Perfectionist сортирует поддерживаемые конструкции в естественном порядке.
  perfectionist.configs['recommended-natural'],
  {
    rules: {
      // Дополнение: Prettier сортирует импорты и в JS, и в TS; отключаем конфликтующие правила для обоих языков.
      'perfectionist/sort-imports': 'off',
      // Дополнение: именованные импорты также сортирует Prettier.
      'perfectionist/sort-named-imports': 'off',
    },
  },
  // Дополнение: проверяем доступность JSX-разметки по рекомендованным правилам jsx-a11y.
  jsxA11y.flatConfigs.recommended,
  // Дополнение: ищем баги, уязвимости и запахи кода по рекомендованным правилам SonarJS.
  sonarjs.configs.recommended,
  // Дополнение: проверяем маршруты по рекомендованным правилам TanStack Router.
  ...pluginRouter.configs['flat/recommended'],
  {
    extends: [
      // Дополнение: вместо шаблонного recommended применяем строгие правила с учётом типов.
      tseslint.configs.strictTypeChecked,
      // Дополнение: проверяем читаемость TypeScript с учётом типов.
      tseslint.configs.stylisticTypeChecked,
      // Проверяем хуки React и зависимости эффектов.
      reactHooks.configs.flat.recommended,
      // Ограничиваем экспорты компонентов для корректной работы Fast Refresh в Vite.
      reactRefresh.configs.vite,
      // Дополнение: проверяем React-компоненты с учётом TypeScript.
      reactX.configs['recommended-typescript'],
      // Дополнение: проверяем работу с DOM в React.
      reactDom.configs.recommended,
    ],
    // Эти правила применяем только к файлам TypeScript и TSX.
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      // Разрешаем глобальные объекты браузера в коде приложения.
      globals: globals.browser,
      parserOptions: {
        // Дополнение: для правил с учётом типов каждый файл получает ближайший tsconfig через сервис TypeScript, как в редакторе.
        projectService: true,
        // Дополнение: ищем tsconfig относительно этой конфигурации, независимо от текущего каталога.
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Дополнение: проверяем тесты по рекомендованным правилам Vitest.
    extends: [vitest.configs.recommended],
    // Дополнение: правила для тестов применяем только к файлам тестов.
    files: ['**/*.test.{ts,tsx}'],
    // Дополнение: правила против ошибок, типичных для тестов, написанных ИИ (https://vitest.dev/guide/learn/writing-tests-with-ai).
    rules: {
      // toBeDefined проходит почти для любого результата и даёт ложную уверенность; проверяем конкретные значения.
      'vitest/no-restricted-matchers': [
        'error',
        { toBeDefined: 'Проверяй конкретное значение (toBe, toStrictEqual, toMatchObject, toBeTypeOf).' },
      ],
      // vi.mock(import('./module')) вместо строкового пути: проверяются путь и типы, переименование файла обновляет мок.
      'vitest/prefer-import-in-mock': 'error',
    },
  },
  {
    // Дополнение: unit-тесты выполняются в Node.js без DOM, а tsc проверяет их с типами DOM из tsconfig.app.json,
    // поэтому обращение к браузерным объектам ловим здесь, а не падением теста при запуске.
    files: ['**/*.test.{ts,tsx}'],
    // Дополнение: browser-тесты выполняются в Chromium, браузерные объекты им доступны.
    ignores: ['**/*.browser.test.{ts,tsx}'],
    rules: {
      // Дополнение: запрещаем браузерные глобальные объекты; тест с DOM должен называться *.browser.test.{ts,tsx}.
      'no-restricted-globals': [
        'error',
        ...browserOnlyGlobals.map((name) => ({
          message: 'В Node.js этого объекта нет: тест с DOM называй *.browser.test.{ts,tsx}.',
          name,
        })),
      ],
    },
  },
  // Дополнение: отключаем правила форматирования, которые могут конфликтовать с Prettier.
  eslintConfigPrettier,
])
