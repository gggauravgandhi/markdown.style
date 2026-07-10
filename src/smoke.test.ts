import { describe, expect, it } from 'vitest'

describe('harness', () => {
  it('runs in jsdom', () => {
    expect(typeof document).toBe('object')
  })
})
