import { describe, expect, it } from 'vitest'
import { anchorDuration, anchorTarget, easeOutExpo } from './scroll'

describe('anchor scroll maths', () => {
  it('scales duration with distance inside a sensible range', () => {
    expect(anchorDuration(0)).toBe(380)
    expect(anchorDuration(100)).toBe(380)
    expect(anchorDuration(900)).toBeGreaterThan(anchorDuration(300))
    expect(anchorDuration(3000)).toBeGreaterThan(anchorDuration(900))
    expect(anchorDuration(100000)).toBe(1100)
    expect(anchorDuration(-3000)).toBe(anchorDuration(3000))
  })

  it('eases out: fast start, settled end, never past the target', () => {
    expect(easeOutExpo(0)).toBe(0)
    expect(easeOutExpo(1)).toBe(1)
    expect(easeOutExpo(0.25)).toBeGreaterThan(0.8)
    expect(easeOutExpo(0.5)).toBeGreaterThan(0.95)
    let last = 0
    for (let t = 0; t <= 1; t += 0.05) {
      const v = easeOutExpo(t)
      expect(v).toBeGreaterThanOrEqual(last)
      expect(v).toBeLessThanOrEqual(1)
      last = v
    }
  })

  it('keeps the destination inside the page', () => {
    expect(anchorTarget(1000, 28, 5000)).toBe(972)
    expect(anchorTarget(10, 28, 5000)).toBe(0)
    expect(anchorTarget(9000, 28, 5000)).toBe(5000)
    expect(anchorTarget(100, 28, -20)).toBe(0)
  })
})
