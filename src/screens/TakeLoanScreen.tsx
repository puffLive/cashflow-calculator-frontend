import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Minus } from 'lucide-react'
import { useAppSelector } from '@/hooks/redux'
import { useSubmitTransactionMutation } from '@/services/transactionApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import TransactionImpactPreview from '@/components/TransactionImpactPreview'

const TakeLoanScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const player = useAppSelector(selectCurrentPlayer)

  const [submitTransaction, { isLoading }] = useSubmitTransactionMutation()

  const [step, setStep] = useState<1 | 2>(1)
  const [loanIncrements, setLoanIncrements] = useState(1) // Number of $1,000 increments
  const MAX_INCREMENTS = 50 // Max $50,000

  const LOAN_INCREMENT = 1000
  const MONTHLY_PAYMENT_RATE = 0.1 // 10% of loan per month

  const loanAmount = loanIncrements * LOAN_INCREMENT
  const monthlyPayment = Math.round(loanAmount * MONTHLY_PAYMENT_RATE)

  const handleIncrement = () => {
    if (loanIncrements < MAX_INCREMENTS) {
      setLoanIncrements(loanIncrements + 1)
    }
  }

  const handleDecrement = () => {
    if (loanIncrements > 1) {
      setLoanIncrements(loanIncrements - 1)
    }
  }

  const calculateImpact = () => {
    const cashBefore = player.cashOnHand
    const cashAfter = cashBefore + loanAmount

    const expensesBefore = player.totalExpenses
    const expensesAfter = expensesBefore + monthlyPayment

    const paydayBefore = player.paydayAmount
    const paydayAfter = paydayBefore - monthlyPayment

    const cashflowBefore = player.cashflow
    const cashflowAfter = cashflowBefore - monthlyPayment

    return {
      cashOnHand: { before: cashBefore, after: cashAfter },
      totalExpenses: { before: expensesBefore, after: expensesAfter },
      paydayAmount: { before: paydayBefore, after: paydayAfter },
      cashflow: { before: cashflowBefore, after: cashflowAfter }
    }
  }

  const handleSubmit = async () => {
    if (!roomCode) return

    const playerId = sessionStorage.getItem('playerId')
    if (!playerId) return

    try {
      await submitTransaction({
        roomCode,
        playerId,
        type: 'loan',
        subType: 'take',
        details: {
          amount: loanAmount,
          monthlyPayment: monthlyPayment
        } as unknown as Record<string, unknown>
      }).unwrap()

      navigate(`/game/${roomCode}/dashboard`)
    } catch (err) {
      console.error('Failed to submit transaction:', err)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(1)
    } else {
      navigate(`/game/${roomCode}/dashboard`)
    }
  }

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
            <h1 className="text-xl font-bold text-gray-800">Take Loan</h1>
            <div className="text-sm text-gray-500">Step {step}/2</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Select Loan Amount */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Loan Amount</h2>
              <p className="text-gray-600">Choose how much you want to borrow in $1,000 increments</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* Loan Amount Display */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Loan Amount</p>
                <p className="text-5xl font-bold text-blue-600">${loanAmount.toLocaleString()}</p>
              </div>

              {/* Increment Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handleDecrement}
                  disabled={loanIncrements === 1}
                  className="w-14 h-14 bg-gray-200 rounded-full hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Minus className="w-6 h-6 text-gray-700" />
                </button>

                <div className="text-center min-w-[120px]">
                  <p className="text-3xl font-bold text-gray-800">{loanIncrements}</p>
                  <p className="text-xs text-gray-500">× $1,000</p>
                </div>

                <button
                  onClick={handleIncrement}
                  disabled={loanIncrements === MAX_INCREMENTS}
                  className="w-14 h-14 bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Plus className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Slider */}
              <div className="px-2">
                <input
                  type="range"
                  min="1"
                  max={MAX_INCREMENTS}
                  value={loanIncrements}
                  onChange={(e) => setLoanIncrements(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$1,000</span>
                  <span>${(MAX_INCREMENTS * LOAN_INCREMENT).toLocaleString()}</span>
                </div>
              </div>

              {/* Impact Preview */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Monthly Payment:</span>
                  <span className="text-2xl font-bold text-red-600">${monthlyPayment.toLocaleString()}</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">New Cash on Hand:</span>
                    <span className="text-blue-800 font-medium">
                      ${(player.cashOnHand + loanAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">New PAYDAY:</span>
                    <span className="text-blue-800 font-medium">
                      ${(player.paydayAmount - monthlyPayment).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Note:</span> Bank loans add ${monthlyPayment.toLocaleString()}/month to your expenses until paid off
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Preview Impact
            </button>
          </div>
        )}

        {/* Step 2: Review Impact */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Loan</h2>
              <p className="text-gray-600">Confirm the financial impact before submitting</p>
            </div>

            <TransactionImpactPreview
              impact={calculateImpact()}
              assetDetails={`Cash received: $${loanAmount.toLocaleString()}`}
              liabilityDetails={`Bank Loan: $${loanAmount.toLocaleString()} (${monthlyPayment.toLocaleString()}/month payment)`}
            />

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

export default TakeLoanScreen