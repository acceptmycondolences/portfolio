import { describe, expect, it } from 'vitest'

import { classNames } from './classNames'

describe('classNames', () => {
  it('объединяет условные классы и разрешает конфликты Tailwind', () => {
    const conditions = { hidden: false }

    expect(
      classNames('p-2 text-sm', conditions.hidden && 'hidden', ['text-base', 'md:p-4'], { 'font-bold': true }),
    ).toBe('p-2 text-base md:p-4 font-bold')
  })

  it('возвращает пустую строку без активных значений', () => {
    expect(classNames(null, undefined, false, 0, '')).toBe('')
  })
})
