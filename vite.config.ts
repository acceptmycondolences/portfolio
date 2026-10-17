/// <reference types="vitest/config" />
// Ссылка на типы Vitest добавляет в defineConfig из vite поле test: Vitest читает настройки тестов из этого же файла,
// поэтому тесты используют те же плагины и алиасы, что и приложение.
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Отделяем React и React DOM от остальных зависимостей, чтобы общий vendor не забирал эти модули.
            {
              name: 'react-vendor',
              // Более высокий приоритет назначает совпавшим модулям группу React раньше общей vendor-группы.
              priority: 20,
              // Ограничиваем совпадение пакетами react и react-dom, не захватывая пакеты с похожим префиксом.
              test: /node_modules[\\/]react(?:-dom)?(?:[\\/]|$)/,
            },
            // Собираем Three.js и его подмодули в отдельную группу для лениво загружаемого 3D-виджета.
            {
              name: 'three-vendor',
              // Приоритет ниже React и выше vendor сохраняет отдельную группу Three.js.
              priority: 15,
              // Совпадают пакет three и его подкаталоги, включая examples.
              test: /node_modules[\\/]three(?:[\\/]|$)/,
            },
            // Помещаем остальные зависимости из node_modules в общий vendor-чанк.
            {
              name: 'vendor',
              // Приоритет ниже специализированных групп оставляет их совпадениям преимущество.
              priority: 10,
              test: /node_modules/,
            },
            // Выделяем достаточно крупные модули, используемые несколькими входами сборки.
            {
              // Требуем разделения модуля как минимум между двумя входами.
              minShareCount: 2,
              // Не создаём общий чанк для модулей суммарным размером меньше 10 КБ.
              minSize: 10000,
              name: 'common',
              // Более низкий приоритет оставляет специализированные группы выше общей группы common.
              priority: 5,
            },
          ],
        },
      },
    },
  },
  // Порядок важен: tanstackRouter() должен стоять перед react(), иначе разделение маршрутов на чанки не сработает.
  plugins: [
    // Пути маршрутов плагин берёт из tsr.config.json, общего с CLI `tsr generate` (pnpm routes:generate).
    // JSON не поддерживает комментарии, поэтому поясняем здесь:
    // - routesDirectory: файловые маршруты лежат в слое app (src/app/routes), а не в src/routes по умолчанию;
    // - generatedRouteTree: дерево маршрутов генерируется рядом с конфигурацией роутера в src/app/router.
    tanstackRouter({
      // Выносим компоненты маршрутов в отдельные чанки, которые загружаются при переходе.
      autoCodeSplitting: true,
    }),
    // Компилируем JSX и включаем Fast Refresh для React.
    react(),
    // Подключаем Tailwind CSS v4 через Vite-плагин.
    tailwindcss(),
  ],
  // Порт и доступ из сети для pnpm preview совпадают с dev-сервером.
  preview: {
    host: true,
    port: 3000,
  },
  resolve: {
    // Берём алиасы из paths в tsconfig, чтобы не дублировать их здесь.
    tsconfigPaths: true,
  },
  // Запускаем dev-сервер на порту 3000 и открываем доступ из локальной сети.
  server: {
    host: true,
    port: 3000,
  },
  // Настройки Vitest.
  test: {
    coverage: {
      // Не учитываем в покрытии сами тесты, объявления типов и сгенерированное дерево маршрутов.
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/app/router/generatedRouteTree.ts',
        // Плагин TanStack преобразует объявления файловых маршрутов; ветки V8 в сгенерированной обёртке не сопоставлены с исходниками.
        'src/app/routes/**/*.tsx',
      ],
      // Считаем покрытие по всем исходникам, а не только по импортированным в тестах, чтобы видеть непокрытые файлы.
      include: ['src/**/*.{ts,tsx}'],
      // Требуем полного покрытия исполняемого кода приложения; декларативные файлы маршрутов проверяются отдельно.
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    // Перед каждым тестом возвращаем мокам исходную реализацию (из фабрики vi.mock или vi.fn), чтобы mockReturnValue
    // из одного теста не влиял на следующие: restoreMocks касается только vi.spyOn, а clearMocks — только истории вызовов.
    mockReset: true,
    // Два набора тестов; оба наследуют плагины, алиасы и общие настройки test из этого файла.
    projects: [
      {
        test: {
          // Тесты браузерного набора сюда не попадают.
          exclude: ['src/**/*.browser.test.{ts,tsx}'],
          // Логика без DOM (функции, сторы, мапперы) быстро выполняется в Node.js.
          // Чистая логика скриптов обслуживания проекта (scripts/) тоже тестируется здесь.
          include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
          name: 'unit',
        },
      },
      {
        test: {
          // Компоненты рендерим в настоящем Chromium через Playwright, а не в эмуляции DOM.
          browser: {
            enabled: true,
            // Без окна браузера: по умолчанию headless включён только в CI, а локально, в pre-commit и у ИИ-агента окно мешает.
            headless: true,
            instances: [{ browser: 'chromium' }],
            provider: playwright(),
          },
          // Сюда попадают только тесты с суффиксом .browser.test.
          include: ['src/**/*.browser.test.{ts,tsx}'],
          name: 'browser',
          // Подключаем типы vitest-browser-react (page.render).
          setupFiles: ['./vitest.browser.setup.ts'],
        },
      },
    ],
    // Возвращаем исходные реализации после vi.spyOn, чтобы шпионы не влияли на следующие тесты.
    restoreMocks: true,
    // Сбрасываем подмены vi.stubEnv после каждого теста.
    unstubEnvs: true,
    // Сбрасываем подмены vi.stubGlobal после каждого теста.
    unstubGlobals: true,
  },
})
