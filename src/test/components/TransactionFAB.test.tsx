import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import TransactionFAB from '@/components/TransactionFAB'

/**
 * Tests for the FAB lockout behavior (Feature 10.3.5). The dashboard wires
 * `<TransactionFAB disabled={hasPendingTransaction} ...>` so that while
 * any transaction is awaiting auditor approval, the user can't queue a
 * second one. The current implementation goes a step further than the
 * spec (which says "same transaction type") and disables ALL transaction
 * paths — this is the safer behavior because the audit pipeline is
 * single-channel anyway.
 */

function renderInRouter(node: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/game/ABCDEF/dashboard']}>
      <Routes>
        <Route path="/game/:roomCode/dashboard" element={node} />
        <Route
          path="/game/:roomCode/transaction/buy"
          element={<div data-testid="buy-screen">BUY</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TransactionFAB — lockout (10.3.5)', () => {
  it('clicking the main button when not disabled expands the action menu', () => {
    renderInRouter(<TransactionFAB />)

    // Action menu starts closed
    expect(screen.queryByLabelText(/buy transaction/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/open transaction menu/i))

    // Now the four sub-actions appear
    expect(screen.getByLabelText(/buy transaction/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sell transaction/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/loan transaction/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/event transaction/i)).toBeInTheDocument()
  })

  it('clicking the main button while disabled does NOT expand the menu', () => {
    renderInRouter(<TransactionFAB disabled disabledTooltip="Pending audit" />)

    fireEvent.click(screen.getByLabelText(/open transaction menu/i))

    // No sub-actions surface — guard clause in handleMainButtonClick.
    expect(screen.queryByLabelText(/buy transaction/i)).not.toBeInTheDocument()
  })

  it('disabled state surfaces the configured tooltip via the title attribute', () => {
    renderInRouter(
      <TransactionFAB disabled disabledTooltip="Waiting for auditor" />,
    )
    expect(screen.getByLabelText(/open transaction menu/i)).toHaveAttribute(
      'title',
      'Waiting for auditor',
    )
  })

  it('disabled state applies the visual gray-out + cursor-not-allowed class', () => {
    renderInRouter(<TransactionFAB disabled />)
    const btn = screen.getByLabelText(/open transaction menu/i)
    expect(btn.className).toMatch(/bg-gray-400/)
    expect(btn.className).toMatch(/cursor-not-allowed/)
    expect(btn).toBeDisabled()
  })
})
