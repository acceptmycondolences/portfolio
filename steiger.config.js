import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

// Проверяем структуру проекта по рекомендованным правилам Feature-Sliced Design.
export default defineConfig(fsd.configs.recommended)
