import { describe, expect, it } from 'vitest'

import { easeOutCircular } from './easeOutCircular'

describe('easeOutCircular', () => {
  it.for([
    { expected: 0, input: 0 },
    { expected: Math.sqrt(0.75), input: 0.5 },
    { expected: 1, input: 1 },
  ])('преобразует прогресс $input в $expected', ({ expected, input }) => {
    expect(easeOutCircular(input)).toBeCloseTo(expected)
  })
})
