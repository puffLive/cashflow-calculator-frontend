import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, Frown, DollarSign, CreditCard, HandCoins } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { useSubmitMarketEventMutation, usePayoffLoanMutation } from '@/services/gameApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import { addNotification } from '@/store/slices/uiSlice'
import TransactionImpactPreview from '@/components/TransactionImpactPreview'
import AssetTypeCard from '@/components/AssetTypeCard'
import OwnedAssetCard from '@/components/OwnedAssetCard'
import type { Liability } from '@/types'

type PaymentType = 'charity' | 'downsized' | 'lend_money' | 'pay_money' | 'payoff_loan'

interface PaymentTypeInfo {
  id: PaymentType
  title: string
  description: string
  icon: typeof Heart
}

const PayTransactionScreen = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { roomCode } = useParams<{ roomCode: string }>()
  const player = useAppSelector(selectCurrentPlayer)

  const [submitMarketEvent, { isLoading: isMarketEventLoading }] = useSubmitMarketEventMutation()
  const [payoffLoan, { isLoading: isPayoffLoanLoading }] = usePayoffLoanMutation()

  const isLoading = isMarketEventLoading || isPayoffLoanLoading

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState<PaymentType | null>(null)
  const [amount, setAmount] = useState(0)
  const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null)

  const paymentTypes: PaymentTypeInfo[] = [
    { id: 'charity', title: 'Charity', description: 'Donate 10% of your income', icon: Heart },
    { id: 'downsized', title: 'Downsized', description: 'Pay expenses from savings', icon: Frown },
    {
      id: 'lend_money',
      title: 'Lend Money',
      description: 'Lend money to another player',
      icon: DollarSign,
    },
    {
      id: 'pay_money',
      title: 'Pay Money',
      description: 'Pay money to another player',
      icon: HandCoins,
    },
    {
      id: 'payoff_loan',
      title: 'Pay Off Loan',
      description: 'Pay off a liability',
      icon: CreditCard,
    },
  ]

  const handleTypeSelect = (typeId: PaymentType) => {
    setSelectedType(typeId)

    // Pre-calculate amounts for certain payment types
    if (typeId === 'downsized') {
      setAmount(player.totalExpenses)
    } else if (typeId === 'charity') {
      setAmount(Math.round(player.totalIncome * 0.1))
    } else {
      setAmount(0)
    }
  }

  const handleNext = () => {
    setStep(2)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(1)
      setSelectedLiability(null)
      setAmount(0)
    } else {
      navigate(`/game/${roomCode}/dashboard`)
    }
  }

  const calculateImpact = () => {
    const cashBefore = player.cashOnHand
    let cashAfter = cashBefore - amount
    // Calculate total liabilities from liabilities array
    let liabilitiesBefore = player.liabilities.reduce((sum, l) => sum + l.currentBalance, 0)
    let liabilitiesAfter = liabilitiesBefore
    let expensesBefore = player.totalExpenses
    let expensesAfter = expensesBefore

    if (selectedType === 'payoff_loan' && selectedLiability) {
      liabilitiesAfter = liabilitiesBefore - selectedLiability.currentBalance
      // Remove the liability payment from monthly expenses
      expensesAfter = expensesBefore - selectedLiability.monthlyPayment
    }

    const paydayBefore = player.paydayAmount
    const paydayAfter = paydayBefore + (expensesAfter - expensesBefore)

    return {
      cashOnHand: { before: cashBefore, after: cashAfter },
      ...(liabilitiesAfter !== liabilitiesBefore && {
        totalLiabilities: { before: liabilitiesBefore, after: liabilitiesAfter },
      }),
      ...(expensesAfter !== expensesBefore && {
        totalExpenses: { before: expensesBefore, after: expensesAfter },
      }),
      ...(paydayAfter !== paydayBefore && {
        paydayAmount: { before: paydayBefore, after: paydayAfter },
      }),
    }
  }

  const getPaymentDetails = (): string => {
    switch (selectedType) {
      case 'charity':
        return `Charity donation (10% of income): $${amount.toLocaleString()}`
      case 'downsized':
        return `Downsized - Paying expenses: $${amount.toLocaleString()}`
      case 'lend_money':
        return `Lending money: $${amount.toLocaleString()}`
      case 'pay_money':
        return `Paying money: $${amount.toLocaleString()}`
      case 'payoff_loan':
        return selectedLiability
          ? `Paying off ${selectedLiability.name}: $${selectedLiability.currentBalance.toLocaleString()}`
          : ''
      default:
        return ''
    }
  }

  const handleSubmit = async () => {
    if (!roomCode || !selectedType) return

    const playerId = sessionStorage.getItem('playerId')
    if (!playerId) return

    try {
      // Use specific endpoints based on payment type
      if (selectedType === 'charity') {
        await submitMarketEvent({
          roomCode,
          playerId,
          subType: 'charity',
          amount,
        }).unwrap()
      } else if (selectedType === 'downsized') {
        await submitMarketEvent({
          roomCode,
          playerId,
          subType: 'downsize',
          amount,
        }).unwrap()
      } else if (selectedType === 'lend_money') {
        await submitMarketEvent({
          roomCode,
          playerId,
          subType: 'lend',
          amount,
        }).unwrap()
      } else if (selectedType === 'pay_money') {
        await submitMarketEvent({
          roomCode,
          playerId,
          subType: 'doodad',
          amount,
        }).unwrap()
      } else if (selectedType === 'payoff_loan') {
        if (!selectedLiability) return
        await payoffLoan({
          roomCode,
          playerId,
          liabilityId: selectedLiability.id,
          payoffAmount: selectedLiability.currentBalance,
        }).unwrap()
      }

      dispatch(
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Payment submitted for audit',
          duration: 3000,
        })
      )

      navigate(`/game/${roomCode}/dashboard`)
    } catch (err: any) {
      console.error('Failed to submit payment:', err)
      console.error('Error details:', err?.data)

      dispatch(
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: err?.data?.message || 'Failed to submit payment',
          duration: 5000,
        })
      )
    }
  }

  const hasInsufficientFunds = amount > player.cashOnHand

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
            <h1 className="text-xl font-bold text-gray-800">Make Payment</h1>
            <div className="text-sm text-gray-500">Step {step}/2</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Payment Type Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Payment Type</h2>
              <p className="text-gray-600">Choose what you want to pay for</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {paymentTypes.map((type) => (
                <AssetTypeCard
                  key={type.id}
                  id={type.id}
                  title={type.title}
                  description={type.description}
                  icon={type.icon}
                  isSelected={selectedType === type.id}
                  onSelect={() => handleTypeSelect(type.id)}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedType}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {step === 2 && selectedType && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {paymentTypes.find((t) => t.id === selectedType)?.title}
              </h2>
              <p className="text-gray-600">
                {paymentTypes.find((t) => t.id === selectedType)?.description}
              </p>
            </div>

            {/* Charity */}
            {selectedType === 'charity' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Give to Charity</h3>
                  <p className="text-sm text-green-700">
                    Donate 10% of your total income to charity.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Your Total Income:</span>
                    <span>${player.totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium text-gray-700">Donation (10%):</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {hasInsufficientFunds && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium">⚠️ Insufficient funds</p>
                  </div>
                )}
              </div>
            )}

            {/* Downsized */}
            {selectedType === 'downsized' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">You've been downsized!</h3>
                  <p className="text-sm text-red-700">
                    You must pay your total monthly expenses from your savings.
                  </p>
                </div>

                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium text-gray-700">Total Expenses:</span>
                  <span className="text-2xl font-bold text-red-600">
                    ${amount.toLocaleString()}
                  </span>
                </div>

                {hasInsufficientFunds && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      ⚠️ You don't have enough cash!
                    </p>
                    <button
                      onClick={() => navigate(`/game/${roomCode}/transaction/loan`)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Take a bank loan →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Lend Money */}
            {selectedType === 'lend_money' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Lend Money to Another Player</h3>
                  <p className="text-sm text-blue-700">Enter the amount you're lending.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Lend *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div
                  className={`p-3 rounded-lg ${hasInsufficientFunds ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className={hasInsufficientFunds ? 'text-red-700' : 'text-blue-700'}>
                      Remaining Cash:
                    </span>
                    <span
                      className={`font-medium ${hasInsufficientFunds ? 'text-red-800' : 'text-blue-800'}`}
                    >
                      ${(player.cashOnHand - amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {hasInsufficientFunds && (
                  <p className="text-sm text-red-600">⚠️ Insufficient funds</p>
                )}
              </div>
            )}

            {/* Pay Money */}
            {selectedType === 'pay_money' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">
                    Pay Money to Another Player
                  </h3>
                  <p className="text-sm text-purple-700">
                    Enter the amount you're paying (e.g., for buying an asset from them).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Pay *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div
                  className={`p-3 rounded-lg ${hasInsufficientFunds ? 'bg-red-50 border border-red-200' : 'bg-purple-50 border border-purple-200'}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className={hasInsufficientFunds ? 'text-red-700' : 'text-purple-700'}>
                      Remaining Cash:
                    </span>
                    <span
                      className={`font-medium ${hasInsufficientFunds ? 'text-red-800' : 'text-purple-800'}`}
                    >
                      ${(player.cashOnHand - amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {hasInsufficientFunds && (
                  <p className="text-sm text-red-600">⚠️ Insufficient funds</p>
                )}
              </div>
            )}

            {/* Pay Off Loan */}
            {selectedType === 'payoff_loan' && (
              <div className="space-y-4">
                {player.liabilities.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600">You don't have any liabilities to pay off</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-lg shadow-md p-4">
                      <p className="text-sm text-gray-700">
                        Select a liability to pay off completely. This will remove the monthly
                        payment from your expenses.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {player.liabilities.map((liability) => (
                        <OwnedAssetCard
                          key={liability.id}
                          asset={{
                            id: liability.id,
                            name: liability.name,
                            type: liability.type as any,
                            costBasis: liability.currentBalance,
                            quantity: 1,
                          }}
                          isSelected={selectedLiability?.id === liability.id}
                          onSelect={() => {
                            setSelectedLiability(liability)
                            setAmount(liability.currentBalance)
                          }}
                        />
                      ))}
                    </div>

                    {selectedLiability && (
                      <div className="bg-white rounded-lg shadow-md p-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Liability Amount:</span>
                            <span className="font-medium text-red-600">
                              ${selectedLiability.currentBalance.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monthly Payment Removed:</span>
                            <span className="font-medium text-green-600">
                              ${selectedLiability.monthlyPayment.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cash After Payment:</span>
                            <span
                              className={`font-medium ${hasInsufficientFunds ? 'text-red-600' : 'text-blue-600'}`}
                            >
                              $
                              {(
                                player.cashOnHand - selectedLiability.currentBalance
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {hasInsufficientFunds && (
                          <p className="text-sm text-red-600 mt-3">
                            ⚠️ Insufficient funds to pay off this liability
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Impact Preview */}
            <TransactionImpactPreview
              impact={calculateImpact()}
              assetDetails={getPaymentDetails()}
            />

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Change Type
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  hasInsufficientFunds ||
                  (selectedType === 'lend_money' && amount <= 0) ||
                  (selectedType === 'pay_money' && amount <= 0) ||
                  (selectedType === 'payoff_loan' && !selectedLiability)
                }
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

export default PayTransactionScreen
