import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { TransactionRejectedModal } from '@/components/TransactionRejectedModal'

/**
 * Tests for the rejection modal + "Edit Transaction" pre-fill flow
 * (Feature 10.3.7). The modal navigates to the matching wizard route
 * with the original transactionData stashed in location.state, where the
 * wizard's mount-effect reads it and seeds the form (covered separately
 * by BuyTransactionScreen integration once the rejection round-trip is
 * exercised).
 */

interface NavCapture {
  pathname: string
  state: unknown
}

function renderWithCapture(
  modal: React.ReactNode,
  capture: NavCapture,
) {
  // Mount a parallel route that reads location.state for our assertion.
  const StateProbe = () => {
    const loc = useLocation()
    capture.pathname = loc.pathname
    capture.state = loc.state
    return <div data-testid="probe">PROBE</div>
  }

  return render(
    <MemoryRouter initialEntries={['/game/ABCDEF/dashboard']}>
      <Routes>
        <Route path="/game/:roomCode/dashboard" element={modal} />
        <Route path="/game/:roomCode/transaction/buy" element={<StateProbe />} />
        <Route path="/game/:roomCode/transaction/sell" element={<StateProbe />} />
        <Route path="/game/:roomCode/transaction/loan" element={<StateProbe />} />
        <Route path="/game/:roomCode/transaction/payoff" element={<StateProbe />} />
        <Route path="/game/:roomCode/transaction/market" element={<StateProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TransactionRejectedModal (10.3.7)', () => {
  it('renders the auditor note and the Edit / Close buttons when open', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <TransactionRejectedModal
          isOpen
          onClose={onClose}
          rejectionNote="That ticker looks fake"
          transactionType="buy"
          transactionData={{ subType: 'stock', details: { name: 'NOPE' } }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /transaction rejected/i })).toBeInTheDocument()
    expect(screen.getByText(/that ticker looks fake/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit transaction/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^close$/i })).toBeInTheDocument()
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <MemoryRouter>
        <TransactionRejectedModal
          isOpen={false}
          onClose={vi.fn()}
          rejectionNote="x"
          transactionType="buy"
        />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('heading', { name: /transaction rejected/i })).not.toBeInTheDocument()
  })

  it('Close button calls onClose', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <TransactionRejectedModal
          isOpen
          onClose={onClose}
          rejectionNote="x"
          transactionType="buy"
        />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it.each([
    ['buy', '/game/ABCDEF/transaction/buy'],
    ['sell', '/game/ABCDEF/transaction/sell'],
    ['loan_take', '/game/ABCDEF/transaction/loan'],
    ['loan_payoff', '/game/ABCDEF/transaction/payoff'],
    ['market_event', '/game/ABCDEF/transaction/market'],
  ])(
    'Edit Transaction navigates %s → %s with rejectedData in location.state',
    (transactionType, expectedPath) => {
      const onClose = vi.fn()
      const capture: NavCapture = { pathname: '', state: null }
      const transactionData = { subType: 'stock', details: { name: 'NOPE' } }

      renderWithCapture(
        <TransactionRejectedModal
          isOpen
          onClose={onClose}
          rejectionNote="x"
          transactionType={transactionType}
          transactionData={transactionData}
        />,
        capture,
      )

      fireEvent.click(screen.getByRole('button', { name: /edit transaction/i }))

      expect(capture.pathname).toBe(expectedPath)
      expect(capture.state).toEqual({ rejectedData: transactionData })
      expect(onClose).toHaveBeenCalled()
    },
  )

  it('falls back to /transaction/buy for unknown transactionType values', () => {
    const capture: NavCapture = { pathname: '', state: null }
    renderWithCapture(
      <TransactionRejectedModal
        isOpen
        onClose={vi.fn()}
        rejectionNote="x"
        transactionType="some-unknown-type"
        transactionData={{ details: { foo: 'bar' } }}
      />,
      capture,
    )

    fireEvent.click(screen.getByRole('button', { name: /edit transaction/i }))
    expect(capture.pathname).toBe('/game/ABCDEF/transaction/buy')
  })
})
