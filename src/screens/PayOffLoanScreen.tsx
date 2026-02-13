import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, CreditCard } from 'lucide-react'
import { useAppSelector } from '@/hooks/redux'
import { useSubmitTransactionMutation } from '@/services/transactionApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import TransactionImpactPreview from '@/components/TransactionImpactPreview'
import type { Liability } from '@/types'

const PayOffLoanScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const player = useAppSelector(selectCurrentPlayer)

  const [submitTransaction, { isLoading }] = useSubmitTransactionMutation()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null)
  const [payoffAmount, setPayoffAmount] = useState(0)

  // Filter for bank loans (can be paid in increments)
  const isBankLoan = selectedLiability?.type === 'bank_loan'
  const maxPayoff = selectedLiability?.currentBalance || 0

  const handleNext = () => {
    if (step === 1 && selectedLiability) {
      // Pre-fill with full balance
      setPayoffAmount(selectedLiability.currentBalance)
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2)
    } else {
      navigate(`/game/${roomCode}/dashboard`)
    }
  }

  const handleIncrement = () => {
    if (isBankLoan && payoffAmount < maxPayoff) {
      setPayoffAmount(Math.min(payoffAmount + 1000, maxPayoff))
    }
  }

  const handleDecrement = () => {
    if (isBankLoan && payoffAmount > 1000) {
      setPayoffAmount(Math.max(payoffAmount - 1000, 1000))
    }
  }

  const calculateImpact = () => {
    if (!selectedLiability) {
      return {
        cashOnHand: { before: player.cashOnHand, after: player.cashOnHand }
      }
    }

    const cashBefore = player.cashOnHand
    const cashAfter = cashBefore - payoffAmount

    // Calculate expense reduction based on payoff amount
    const isFullPayoff = payoffAmount === selectedLiability.currentBalance
    const expenseReduction = isFullPayoff
      ? selectedLiability.monthlyPayment
      : Math.round((selectedLiability.monthlyPayment * payoffAmount) / selectedLiability.currentBalance)

    const expensesBefore = player.totalExpenses
    const expensesAfter = expensesBefore - expenseReduction

    const paydayBefore = player.paydayAmount
    const paydayAfter = paydayBefore + expenseReduction

    const cashflowBefore = player.cashflow
    const cashflowAfter = cashflowBefore + expenseReduction

    return {
      cashOnHand: { before: cashBefore, after: cashAfter },
      totalExpenses: { before: expensesBefore, after: expensesAfter },
      paydayAmount: { before: paydayBefore, after: paydayAfter },
      cashflow: { before: cashflowBefore, after: cashflowAfter }
    }
  }

  const getLiabilityDetails = (): string => {
    if (!selectedLiability) return ''

    const isFullPayoff = payoffAmount === selectedLiability.currentBalance
    if (isFullPayoff) {
      return `Paying off ${selectedLiability.name} in full ($${payoffAmount.toLocaleString()})`
    } else {
      const remaining = selectedLiability.currentBalance - payoffAmount
      return `Partial payment on ${selectedLiability.name}: $${payoffAmount.toLocaleString()} (Remaining: $${remaining.toLocaleString()})`
    }
  }

  const handleSubmit = async () => {
    if (!roomCode || !selectedLiability) return

    const playerId = sessionStorage.getItem('playerId')
    if (!playerId) return

    try {
      await submitTransaction({
        roomCode,
        playerId,
        type: 'loan',
        subType: 'payoff',
        details: {
          liabilityId: selectedLiability.id,
          liabilityName: selectedLiability.name,
          payoffAmount: payoffAmount,
          isFullPayoff: payoffAmount === selectedLiability.currentBalance
        } as unknown as Record<string, unknown>
      }).unwrap()

      navigate(`/game/${roomCode}/dashboard`)
    } catch (err) {
      console.error('Failed to submit transaction:', err)
    }
  }

  const hasInsufficientFunds = payoffAmount > player.cashOnHand

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Pay Off Loan</h1>
            <div className="text-sm text-gray-500">Step {step}/3</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Select Liability */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Debt to Pay Off</h2>
              <p className="text-gray-600">Choose which liability you want to pay off</p>
            </div>

            {player.liabilities.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg mb-4">You don't have any debts to pay off</p>
                <button
                  onClick={() => navigate(`/game/${roomCode}/dashboard`)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {player.liabilities.map((liability) => (
                    <div
                      key={liability.id}
                      onClick={() => setSelectedLiability(liability)}
                      className={`
                        cursor-pointer transition-all duration-200 rounded-lg p-4 border-2
                        ${selectedLiability?.id === liability.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${selectedLiability?.id === liability.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <CreditCard className={`w-6 h-6 ${selectedLiability?.id === liability.id ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800">{liability.name}</h3>
                              <p className="text-xs text-gray-500 capitalize">{liability.type.replace('_', ' ')}</p>
                            </div>
                            {selectedLiability?.id === liability.id && (
                              <span className="text-xs text-blue-600 font-medium">✓</span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Original:</span>
                              <span className="ml-1 font-medium text-gray-800">${liability.originalAmount.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Balance:</span>
                              <span className="ml-1 font-medium text-red-600">${liability.currentBalance.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Payment:</span>
                              <span className="ml-1 font-medium text-gray-800">${liability.monthlyPayment.toLocaleString()}/mo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!selectedLiability}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Payoff Amount */}
        {step === 2 && selectedLiability && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payoff Amount</h2>
              <p className="text-gray-600">How much do you want to pay?</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* Liability Summary */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">{selectedLiability.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>Current Balance: ${selectedLiability.currentBalance.toLocaleString()}</div>
                  <div>Monthly Payment: ${selectedLiability.monthlyPayment.toLocaleString()}</div>
                </div>
              </div>

              {/* Payoff Amount Input */}
              {isBankLoan ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payoff Amount ($1,000 increments)
                  </label>

                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button
                      onClick={handleDecrement}
                      disabled={payoffAmount <= 1000}
                      className="w-12 h-12 bg-gray-200 rounded-full hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5 text-gray-700" />
                    </button>

                    <div className="text-center min-w-[150px]">
                      <p className="text-3xl font-bold text-gray-800">${(payoffAmount / 1000).toFixed(0)}k</p>
                    </div>

                    <button
                      onClick={handleIncrement}
                      disabled={payoffAmount >= maxPayoff}
                      className="w-12 h-12 bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <input
                    type="range"
                    min="1000"
                    max={maxPayoff}
                    step="1000"
                    value={payoffAmount}
                    onChange={(e) => setPayoffAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$1,000</span>
                    <span>${maxPayoff.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payoff Amount *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={payoffAmount}
                    onChange={(e) => setPayoffAmount(Math.min(Number(e.target.value), maxPayoff))}
                    max={maxPayoff}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: ${maxPayoff.toLocaleString()}</p>
                </div>
              )}

              {/* Summary */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Payoff Amount:</span>
                  <span className="text-2xl font-bold text-green-600">${payoffAmount.toLocaleString()}</span>
                </div>

                <div className={`p-3 rounded-lg ${hasInsufficientFunds ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex justify-between text-sm">
                    <span className={hasInsufficientFunds ? 'text-red-700' : 'text-blue-700'}>Cash on Hand:</span>
                    <span className={hasInsufficientFunds ? 'text-red-800 font-medium' : 'text-blue-800 font-medium'}>
                      ${player.cashOnHand.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={hasInsufficientFunds ? 'text-red-700' : 'text-blue-700'}>Remaining Cash:</span>
                    <span className={hasInsufficientFunds ? 'text-red-800 font-medium' : 'text-blue-800 font-medium'}>
                      ${(player.cashOnHand - payoffAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {hasInsufficientFunds && (
                  <p className="text-sm text-red-600">⚠️ Insufficient funds for this payment</p>
                )}

                {payoffAmount === selectedLiability.currentBalance && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Full payoff - This debt will be completely eliminated
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={payoffAmount === 0}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Preview Impact
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Impact */}
        {step === 3 && selectedLiability && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Payment</h2>
              <p className="text-gray-600">Confirm the financial impact before submitting</p>
            </div>

            <TransactionImpactPreview
              impact={calculateImpact()}
              liabilityDetails={getLiabilityDetails()}
            />

            {hasInsufficientFunds && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Warning: This payment will result in negative cash balance
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Change Amount
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit for Audit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PayOffLoanScreen