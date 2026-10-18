// LF, два пробела, пробельные отступы и перевод строки в конце уже совпадают с EditorConfig.
/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  // Группируем импорты по внешним пакетам и слоям проекта; '' отделяет группы пустой строкой.
  importOrder: [
    // React идёт перед остальными внешними зависимостями.
    '^(react(/.*)?)$',
    '^(react-dom(/.*)?)$',
    '',
    // Остальные внешние пакеты держим отдельной группой.
    '<THIRD_PARTY_MODULES>',
    '',
    // Алиасы идут сверху вниз по слоям проекта.
    '^~/app/(.*)$',
    '',
    '^~/pages/(.*)$',
    '',
    '^~/widgets/(.*)$',
    '',
    '^~/features/(.*)$',
    '',
    '^~/entities/(.*)$',
    '',
    '^~/shared/(.*)$',
    '',
    // Относительные импорты размещаем последними.
    '^[.]',
  ],
  // Разбираем TypeScript, JSX и устаревший синтаксис декораторов при сортировке импортов.
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  // Переопределяем общую ширину только для Markdown.
  overrides: [
    {
      // Совпадает с секцией [*.md] в EditorConfig.
      files: '*.md',
      options: {
        // Не переносим строки по ширине, как max_line_length = off в EditorConfig.
        printWidth: Infinity,
      },
    },
  ],
  // Сортируем импорты и классы Tailwind при форматировании.
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  // Совпадает с max_line_length = 120 в EditorConfig.
  printWidth: 120,
  // Опускаем точки с запятой в конце инструкций для единого стиля кода.
  semi: false,
  // Используем одинарные кавычки в JS/TS для единого стиля кода.
  singleQuote: true,
  // Сортируем классы Tailwind внутри вызовов classNames().
  tailwindFunctions: ['classNames'],
  // Берём тему и утилиты Tailwind v4 из входного CSS файла проекта.
  tailwindStylesheet: './src/app/styles/index.css',
}
