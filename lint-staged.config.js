// pre-commit запускает lint-staged с --concurrent false: ключи выполняются по очереди в порядке объявления,
// поэтому tsc и Vitest из последнего ключа читают файлы, уже отформатированные Prettier.
// Шаблоны для Prettier не пересекаются, чтобы каждый файл форматировался один раз.
/** @type {import('lint-staged').Configuration} */
export default {
  // Форматируем все индексированные файлы, кроме JS/TS; неподдерживаемые Prettier пропускаем без ошибки.
  '!(*.{js,ts,tsx})': ['prettier --ignore-unknown --write --cache'],
  // Сначала форматируем JS/TS, затем блокируем коммит при любой ошибке или предупреждении ESLint.
  // --no-warn-ignored: исключённые из ESLint файлы (generatedRouteTree.ts) иначе дают предупреждение «File ignored»,
  // и --max-warnings 0 блокирует коммит.
  '*.{js,ts,tsx}': ['prettier --write --cache', 'eslint --max-warnings 0 --no-warn-ignored'],
  // Функции не передают список индексированных файлов: этим командам он не нужен. Строке vitest список передаётся.
  '*.{ts,tsx}': [
    // Перегенерируем дерево маршрутов по индексированным маршрутам и проверяем типы всего проекта по tsconfig.
    () => 'pnpm types:check',
    // Блокируем коммит, если дерево маршрутов изменилось после генерации: его нужно добавить в коммит вместе с маршрутами.
    () => 'git diff --exit-code -- src/app/router/generatedRouteTree.ts',
    // Запускаем только тесты, которые зависят от индексированных файлов; отсутствие таких тестов не ошибка.
    'vitest related --run --passWithNoTests',
  ],
}
