import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Frown,
  Heart,
  ShoppingBag,
  Baby as BabyIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react'
import { useAppSelector } from '@/hooks/redux'
import { useSubmitTransactionMutation } from '@/services/transactionApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import TransactionImpactPreview from '@/components/TransactionImpactPreview'
import AssetTypeCard from '@/components/AssetTypeCard'
import OwnedAssetCard from '@/components/OwnedAssetCard'
import type { Asset } from '@/types'

type EventType =
  | 'downsized'
  | 'charity'
  | 'doodad'
  | 'baby'
  | 'stock_split'
  | 'reverse_stock_split'
  | 'lend_collect'

interface EventTypeInfo {
  id: EventType
  title: string
  description: string
  icon: typeof Frown
}

const MarketEventScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const player = useAppSelector(selectCurrentPlayer)

  const [submitTransaction, { isLoading }] = useSubmitTransactionMutation()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)
  const [amount, setAmount] = useState(0)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isLending, setIsLending] = useState(true) // true = lend (negative), false = collect (positive)

  const eventTypes: EventTypeInfo[] = [
    {
      id: 'downsized',
      title: 'Downsized',
      description: 'Lost your job - pay expenses from savings',
      icon: Frown,
    },
    { id: 'charity', title: 'Charity', description: 'Donate 10% of your income', icon: Heart },
    {
      id: 'doodad',
      title: 'Doodad',
      description: 'Impulse purchase - spend on luxury item',
      icon: ShoppingBag,
    },
    { id: 'baby', title: 'Baby', description: 'New addition to the family', icon: BabyIcon },
    {
      id: 'stock_split',
      title: 'Stock Split',
      description: 'Double your shares, halve the price',
      icon: TrendingUp,
    },
    {
      id: 'reverse_stock_split',
      title: 'Reverse Split',
      description: 'Halve your shares, double the price',
      icon: TrendingDown,
    },
    {
      id: 'lend_collect',
      title: 'Lend/Collect Money',
      description: 'Lend money to or collect from a friend',
      icon: DollarSign,
    },
  ]

  const handleEventSelect = (eventId: EventType) => {
    setSelectedEvent(eventId)

    // Pre-calculate amounts for certain events
    if (eventId === 'downsized') {
      setAmount(player.totalExpenses)
    } else if (eventId === 'charity') {
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
    } else {
      navigate(`/game/${roomCode}/dashboard`)
    }
  }

  const calculateImpact = () => {
    const cashBefore = player.cashOnHand
    let cashAfter = cashBefore
    let expensesBefore = player.totalExpenses
    let expensesAfter = expensesBefore
    let incomeBefore = player.totalIncome
    let incomeAfter = incomeBefore

    switch (selectedEvent) {
      case 'downsized':
      case 'charity':
      case 'doodad':
        cashAfter = cashBefore - amount
        break
      case 'baby':
        expensesAfter =
          expensesBefore + (player.expenses.find((e) => e.type === 'child')?.amount || 0)
        break
      case 'lend_collect':
        cashAfter = isLending ? cashBefore - amount : cashBefore + amount
        break
      case 'stock_split':
      case 'reverse_stock_split':
        // No immediate cash impact
        break
    }

    const paydayBefore = player.paydayAmount
    const paydayAfter =
      paydayBefore + (incomeAfter - incomeBefore) - (expensesAfter - expensesBefore)

    const cashflowBefore = player.cashflow
    const cashflowAfter =
      cashflowBefore + (incomeAfter - incomeBefore) - (expensesAfter - expensesBefore)

    return {
      cashOnHand: { before: cashBefore, after: cashAfter },
      ...(expensesAfter !== expensesBefore && {
        totalExpenses: { before: expensesBefore, after: expensesAfter },
      }),
      ...(incomeAfter !== incomeBefore && {
        totalIncome: { before: incomeBefore, after: incomeAfter },
      }),
      ...(paydayAfter !== paydayBefore && {
        paydayAmount: { before: paydayBefore, after: paydayAfter },
      }),
      ...(cashflowAfter !== cashflowBefore && {
        cashflow: { before: cashflowBefore, after: cashflowAfter },
      }),
    }
  }

  const getEventDetails = (): string => {
    switch (selectedEvent) {
      case 'downsized':
        return `Downsized - Paying expenses: $${amount.toLocaleString()}`
      case 'charity':
        return `Charity donation (10% of income): $${amount.toLocaleString()}`
      case 'doodad':
        return `Doodad purchase: $${amount.toLocaleString()}`
      case 'baby':
        return `New baby - Additional monthly expense`
      case 'stock_split':
        return selectedAsset
          ? `Stock split: ${selectedAsset.name} (${selectedAsset.quantity} → ${selectedAsset.quantity * 2} shares)`
          : ''
      case 'reverse_stock_split':
        return selectedAsset
          ? `Reverse split: ${selectedAsset.name} (${selectedAsset.quantity} → ${Math.floor(selectedAsset.quantity / 2)} shares)`
          : ''
      case 'lend_collect':
        return isLending
          ? `Lending money: $${amount.toLocaleString()}`
          : `Collecting money: $${amount.toLocaleString()}`
      default:
        return ''
    }
  }

  const handleSubmit = async () => {
    if (!roomCode || !selectedEvent) return

    const playerId = sessionStorage.getItem('playerId')
    if (!playerId) return

    const details: Record<string, unknown> = { amount }

    if (selectedEvent === 'stock_split' || selectedEvent === 'reverse_stock_split') {
      if (!selectedAsset) return
      details.assetId = selectedAsset.id
      details.assetName = selectedAsset.name
      details.currentShares = selectedAsset.quantity
      details.newShares =
        selectedEvent === 'stock_split'
          ? selectedAsset.quantity * 2
          : Math.floor(selectedAsset.quantity / 2)
    }

    if (selectedEvent === 'lend_collect') {
      details.isLending = isLending
    }

    try {
      await submitTransaction({
        roomCode,
        playerId,
        type: 'market_event',
        subType: selectedEvent,
        details,
      }).unwrap()

      navigate(`/game/${roomCode}/dashboard`)
    } catch (err) {
      console.error('Failed to submit transaction:', err)
    }
  }

  const hasInsufficientFunds =
    (selectedEvent === 'downsized' ||
      selectedEvent === 'charity' ||
      selectedEvent === 'doodad' ||
      (selectedEvent === 'lend_collect' && isLending)) &&
    amount > player.cashOnHand

  // Filter stocks for split operations
  const stocks = player.assets.filter((a) => a.type === 'stock' || a.type === 'mutual_fund')

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
            <h1 className="text-xl font-bold text-gray-800">Market Event</h1>
            <div className="text-sm text-gray-500">Step {step}/2</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Event Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Market Event</h2>
              <p className="text-gray-600">Choose the type of event that occurred</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {eventTypes.map((event) => (
                <AssetTypeCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description}
                  icon={event.icon}
                  isSelected={selectedEvent === event.id}
                  onSelect={() => handleEventSelect(event.id)}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedEvent}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Event Details */}
        {step === 2 && selectedEvent && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {eventTypes.find((e) => e.id === selectedEvent)?.title}
              </h2>
              <p className="text-gray-600">
                {eventTypes.find((e) => e.id === selectedEvent)?.description}
              </p>
            </div>

            {/* Downsized */}
            {selectedEvent === 'downsized' && (
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

            {/* Charity */}
            {selectedEvent === 'charity' && (
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
              </div>
            )}

            {/* Doodad */}
            {selectedEvent === 'doodad' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Impulse Purchase!</h3>
                  <p className="text-sm text-yellow-700">
                    You bought something you don't really need.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Amount *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Remaining Cash:</span>
                  <span className={hasInsufficientFunds ? 'text-red-600 font-medium' : ''}>
                    ${(player.cashOnHand - amount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Baby */}
            {selectedEvent === 'baby' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">🎉 Congratulations!</h3>
                  <p className="text-sm text-blue-700">
                    You have a new baby! This adds to your monthly expenses.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>New Child Expense:</span>
                    <span className="font-medium text-red-600">
                      +$
                      {(
                        player.expenses.find((e) => e.type === 'child')?.amount || 0
                      ).toLocaleString()}
                      /month
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>New Total Expenses:</span>
                    <span className="font-medium">
                      $
                      {(
                        player.totalExpenses +
                        (player.expenses.find((e) => e.type === 'child')?.amount || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>New PAYDAY:</span>
                    <span className="font-medium">
                      $
                      {(
                        player.paydayAmount -
                        (player.expenses.find((e) => e.type === 'child')?.amount || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Split / Reverse Split */}
            {(selectedEvent === 'stock_split' || selectedEvent === 'reverse_stock_split') && (
              <div className="space-y-4">
                {stocks.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600">You don't own any stocks</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-lg shadow-md p-4">
                      <p className="text-sm text-gray-700">
                        {selectedEvent === 'stock_split'
                          ? 'Select a stock to double your shares and halve the cost per share'
                          : 'Select a stock to halve your shares (rounded down) and double the cost per share'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {stocks.map((asset) => (
                        <OwnedAssetCard
                          key={asset.id}
                          asset={asset}
                          isSelected={selectedAsset?.id === asset.id}
                          onSelect={() => setSelectedAsset(asset)}
                        />
                      ))}
                    </div>

                    {selectedAsset && (
                      <div className="bg-white rounded-lg shadow-md p-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Before → After</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shares:</span>
                            <span className="font-medium">
                              {selectedAsset.quantity} →{' '}
                              {selectedEvent === 'stock_split'
                                ? selectedAsset.quantity * 2
                                : Math.floor(selectedAsset.quantity / 2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cost/Share:</span>
                            <span className="font-medium">
                              ${(selectedAsset.costBasis / selectedAsset.quantity).toFixed(2)} → $
                              {selectedEvent === 'stock_split'
                                ? (selectedAsset.costBasis / selectedAsset.quantity / 2).toFixed(2)
                                : ((selectedAsset.costBasis / selectedAsset.quantity) * 2).toFixed(
                                    2
                                  )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Lend/Collect Money */}
            {selectedEvent === 'lend_collect' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsLending(true)}
                      className={`py-3 px-4 rounded-lg border-2 transition-all ${
                        isLending
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Lend Money (-)
                    </button>
                    <button
                      onClick={() => setIsLending(false)}
                      className={`py-3 px-4 rounded-lg border-2 transition-all ${
                        !isLending
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Collect Money (+)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div
                  className={`p-3 rounded-lg ${hasInsufficientFunds ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className={hasInsufficientFunds ? 'text-red-700' : 'text-blue-700'}>
                      Cash Impact:
                    </span>
                    <span
                      className={`font-medium ${hasInsufficientFunds ? 'text-red-800' : 'text-blue-800'}`}
                    >
                      {isLending ? '-' : '+'}${amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={hasInsufficientFunds ? 'text-red-700' : 'text-blue-700'}>
                      New Cash on Hand:
                    </span>
                    <span
                      className={`font-medium ${hasInsufficientFunds ? 'text-red-800' : 'text-blue-800'}`}
                    >
                      $
                      {(isLending
                        ? player.cashOnHand - amount
                        : player.cashOnHand + amount
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {hasInsufficientFunds && (
                  <p className="text-sm text-red-600">⚠️ Insufficient funds to lend this amount</p>
                )}
              </div>
            )}

            {/* Impact Preview */}
            <TransactionImpactPreview impact={calculateImpact()} assetDetails={getEventDetails()} />

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Change Event
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  (selectedEvent === 'doodad' && amount === 0) ||
                  ((selectedEvent === 'stock_split' || selectedEvent === 'reverse_stock_split') &&
                    !selectedAsset) ||
                  (selectedEvent === 'lend_collect' && amount === 0)
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

export default MarketEventScreen
