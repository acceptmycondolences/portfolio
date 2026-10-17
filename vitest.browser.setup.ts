// Подключаем vitest-browser-react, чтобы TypeScript видел page.render и связанные типы.
// Очистку отрендеренных компонентов библиотека выполняет сама перед каждым тестом.
import 'vitest-browser-react'
// Реальные стили задают размеры canvas и адаптивную видимость элементов в browser-тестах.
import './src/app/styles/index.css'
