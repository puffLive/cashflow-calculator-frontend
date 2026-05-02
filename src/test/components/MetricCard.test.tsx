import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import MetricCard from '@/components/MetricCard'

/**
 * Tests for the flash-on-change animation (Feature 10.3.6). When the
 * dashboard receives a `transaction:finalized` socket event, the changed
 * metrics flash green briefly so the user can see them settle from the
 * pending state.
 */
describe('MetricCard — flash-on-change (10.3.6)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not flash on initial mount (would be noisy if it did)', () => {
    render(<MetricCard label="Cash" value={5000} />)
    const valueEl = screen.getByTestId('metric-value')
    expect(valueEl.getAttribute('data-flashing')).toBe('false')
  })

  it('flashes when value changes; flash clears after the timeout', () => {
    const { rerender } = render(<MetricCard label="Cash" value={5000} />)

    rerender(<MetricCard label="Cash" value={7400} />)

    expect(screen.getByTestId('metric-value').getAttribute('data-flashing')).toBe('true')

    act(() => {
      vi.advanceTimersByTime(900)
    })

    expect(screen.getByTestId('metric-value').getAttribute('data-flashing')).toBe('false')
  })

  it('does not flash when the value re-renders with the same number', () => {
    const { rerender } = render(<MetricCard label="Cash" value={5000} />)

    // Same value, different prop instance — useEffect's prev-ref check should bail
    rerender(<MetricCard label="Cash" value={5000} />)

    expect(screen.getByTestId('metric-value').getAttribute('data-flashing')).toBe('false')
  })

  it('formats the value as USD currency with no decimals', () => {
    render(<MetricCard label="Cash" value={1234567} />)
    expect(screen.getByText('$1,234,567')).toBeInTheDocument()
  })
})
