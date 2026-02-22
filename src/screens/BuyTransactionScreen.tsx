import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Building2, Coins, Gem, Briefcase, PieChart } from 'lucide-react'
import { useAppSelector } from '@/hooks/redux'
import { useSubmitTransactionMutation } from '@/services/transactionApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import AssetTypeCard from '@/components/AssetTypeCard'
import TransactionImpactPreview from '@/components/TransactionImpactPreview'

type AssetType = 'stock' | 'mutual_fund' | 'cd' | 'real_estate' | 'gold' | 'business'

interface AssetTypeInfo {
  id: AssetType
  title: string
  description: string
  icon: typeof TrendingUp
}

interface TransactionDetails {
  // Common fields
  name: string

  // Stock/Mutual Fund fields
  pricePerShare?: number
  numberOfShares?: number
  dividendPerShare?: number

  // CD fields
  cdValue?: number
  interestRate?: number

  // Real Estate fields
  totalCost?: number
  downPayment?: number
  mortgageAmount?: number
  monthlyCashflow?: number

  // Gold fields
  costPerUnit?: number
  quantity?: number

  // Business fields
  businessCost?: number
  businessDownPayment?: number
  businessCashflow?: number
}

const BuyTransactionScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const player = useAppSelector(selectCurrentPlayer)

  const [submitTransaction, { isLoading }] = useSubmitTransactionMutation()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null)
  const [details, setDetails] = useState<TransactionDetails>({ name: '' })

  const assetTypes: AssetTypeInfo[] = [
    {
      id: 'stock',
      title: 'Stocks',
      description: 'Individual company shares with potential dividends',
      icon: TrendingUp,
    },
    {
      id: 'mutual_fund',
      title: 'Mutual Funds',
      description: 'Diversified investment portfolios',
      icon: PieChart,
    },
    {
      id: 'cd',
      title: 'CDs',
      description: 'Fixed-term savings with guaranteed returns',
      icon: Coins,
    },
    {
      id: 'real_estate',
      title: 'Real Estate',
      description: 'Property investments with rental income',
      icon: Building2,
    },
    {
      id: 'gold',
      title: 'Gold/Precious Metals',
      description: 'Physical commodities as store of value',
      icon: Gem,
    },
    {
      id: 'business',
      title: 'Business',
      description: 'Small business ownership opportunities',
      icon: Briefcase,
    },
  ]

  const calculateTotalCost = (): number => {
    if (!selectedAssetType) return 0

    switch (selectedAssetType) {
      case 'stock':
      case 'mutual_fund':
        return (details.pricePerShare || 0) * (details.numberOfShares || 0)
      case 'cd':
        return details.cdValue || 0
      case 'real_estate':
        return details.downPayment || 0
      case 'gold':
        return (details.costPerUnit || 0) * (details.quantity || 0)
      case 'business':
        return details.businessDownPayment || 0
      default:
        return 0
    }
  }

  const calculateImpact = () => {
    const cost = calculateTotalCost()
    const cashBefore = player.cashOnHand
    const cashAfter = cashBefore - cost

    let incomeIncrease = 0
    let expenseIncrease = 0

    if (selectedAssetType === 'stock' || selectedAssetType === 'mutual_fund') {
      incomeIncrease = (details.dividendPerShare || 0) * (details.numberOfShares || 0)
    } else if (selectedAssetType === 'cd') {
      incomeIncrease = ((details.cdValue || 0) * (details.interestRate || 0)) / 100 / 12
    } else if (selectedAssetType === 'real_estate') {
      incomeIncrease = details.monthlyCashflow || 0
      expenseIncrease =
        (details.mortgageAmount || 0) > 0 ? ((details.mortgageAmount || 0) * 0.1) / 12 : 0
    } else if (selectedAssetType === 'business') {
      incomeIncrease = details.businessCashflow || 0
    }

    const incomeBefore = player.totalIncome
    const incomeAfter = incomeBefore + incomeIncrease

    const expensesBefore = player.totalExpenses
    const expensesAfter = expensesBefore + expenseIncrease

    const paydayBefore = player.paydayAmount
    const paydayAfter = paydayBefore + incomeIncrease - expenseIncrease

    const cashflowBefore = player.cashflow
    const cashflowAfter = cashflowBefore + incomeIncrease - expenseIncrease

    return {
      cashOnHand: { before: cashBefore, after: cashAfter },
      totalIncome: { before: incomeBefore, after: incomeAfter },
      totalExpenses: { before: expensesBefore, after: expensesAfter },
      paydayAmount: { before: paydayBefore, after: paydayAfter },
      cashflow: { before: cashflowBefore, after: cashflowAfter },
    }
  }

  const getAssetDetails = (): string => {
    if (!selectedAssetType) return ''

    switch (selectedAssetType) {
      case 'stock':
      case 'mutual_fund':
        return `${details.numberOfShares} shares of ${details.name} @ ${details.pricePerShare}/share${details.dividendPerShare ? `, $${details.dividendPerShare}/share dividend` : ''}`
      case 'cd':
        return `${details.name} CD worth $${details.cdValue?.toLocaleString()} at ${details.interestRate}% interest`
      case 'real_estate':
        return `${details.name} - Total: $${details.totalCost?.toLocaleString()}, Down: $${details.downPayment?.toLocaleString()}, Cashflow: $${details.monthlyCashflow}/mo`
      case 'gold':
        return `${details.quantity} units of ${details.name} @ $${details.costPerUnit}/unit`
      case 'business':
        return `${details.name} - Total: $${details.businessCost?.toLocaleString()}, Down: $${details.businessDownPayment?.toLocaleString()}, Cashflow: $${details.businessCashflow}/mo`
      default:
        return ''
    }
  }

  const getLiabilityDetails = (): string => {
    if (selectedAssetType === 'real_estate' && (details.mortgageAmount || 0) > 0) {
      return `Mortgage: $${details.mortgageAmount?.toLocaleString()} on ${details.name}`
    }
    if (
      selectedAssetType === 'business' &&
      (details.businessCost || 0) > (details.businessDownPayment || 0)
    ) {
      const liability = (details.businessCost || 0) - (details.businessDownPayment || 0)
      return `Business Loan: $${liability.toLocaleString()} for ${details.name}`
    }
    return ''
  }

  const handleNext = () => {
    if (step === 1 && selectedAssetType) {
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

  const handleSubmit = async () => {
    if (!roomCode || !selectedAssetType) return

    const playerId = sessionStorage.getItem('playerId')
    if (!playerId) return

    try {
      await submitTransaction({
        roomCode,
        playerId,
        type: 'buy',
        subType: selectedAssetType,
        details: details as unknown as Record<string, unknown>,
      }).unwrap()

      navigate(`/game/${roomCode}/dashboard`)
    } catch (err) {
      console.error('Failed to submit transaction:', err)
    }
  }

  const totalCost = calculateTotalCost()
  const remainingCash = player.cashOnHand - totalCost
  const hasInsufficientFunds = remainingCash < 0

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
            <h1 className="text-xl font-bold text-gray-800">Buy Asset</h1>
            <div className="text-sm text-gray-500">Step {step}/3</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Asset Type Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Asset Type</h2>
              <p className="text-gray-600">Select the type of asset you want to purchase</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {assetTypes.map((assetType) => (
                <AssetTypeCard
                  key={assetType.id}
                  id={assetType.id}
                  title={assetType.title}
                  description={assetType.description}
                  icon={assetType.icon}
                  isSelected={selectedAssetType === assetType.id}
                  onSelect={() => setSelectedAssetType(assetType.id)}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedAssetType}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Transaction Details */}
        {step === 2 && selectedAssetType && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction Details</h2>
              <p className="text-gray-600">
                Enter the details for your{' '}
                {assetTypes.find((a) => a.id === selectedAssetType)?.title} purchase
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              {/* Common: Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name *</label>
                <input
                  type="text"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter asset name"
                />
              </div>

              {/* Stock/Mutual Fund Fields */}
              {(selectedAssetType === 'stock' || selectedAssetType === 'mutual_fund') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Share *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.pricePerShare || ''}
                      onChange={(e) =>
                        setDetails({ ...details, pricePerShare: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Shares *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.numberOfShares || ''}
                      onChange={(e) =>
                        setDetails({ ...details, numberOfShares: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dividend per Share (optional)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.dividendPerShare || ''}
                      onChange={(e) =>
                        setDetails({ ...details, dividendPerShare: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {/* CD Fields */}
              {selectedAssetType === 'cd' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CD Value *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.cdValue || ''}
                      onChange={(e) => setDetails({ ...details, cdValue: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interest Rate (%) *
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={details.interestRate || ''}
                      onChange={(e) =>
                        setDetails({ ...details, interestRate: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.0"
                    />
                  </div>
                </>
              )}

              {/* Real Estate Fields */}
              {selectedAssetType === 'real_estate' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Cost *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.totalCost || ''}
                      onChange={(e) =>
                        setDetails({ ...details, totalCost: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Down Payment *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.downPayment || ''}
                      onChange={(e) =>
                        setDetails({ ...details, downPayment: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mortgage Amount *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.mortgageAmount || ''}
                      onChange={(e) =>
                        setDetails({ ...details, mortgageAmount: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Cashflow *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.monthlyCashflow || ''}
                      onChange={(e) =>
                        setDetails({ ...details, monthlyCashflow: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {/* Gold Fields */}
              {selectedAssetType === 'gold' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost per Unit *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.costPerUnit || ''}
                      onChange={(e) =>
                        setDetails({ ...details, costPerUnit: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.quantity || ''}
                      onChange={(e) => setDetails({ ...details, quantity: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {/* Business Fields */}
              {selectedAssetType === 'business' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Cost *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.businessCost || ''}
                      onChange={(e) =>
                        setDetails({ ...details, businessCost: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Down Payment *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.businessDownPayment || ''}
                      onChange={(e) =>
                        setDetails({ ...details, businessDownPayment: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Cashflow *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={details.businessCashflow || ''}
                      onChange={(e) =>
                        setDetails({ ...details, businessCashflow: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {/* Cost Summary */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Total Cost:</span>
                  <span className="text-2xl font-bold text-gray-800">
                    ${totalCost.toLocaleString()}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-lg ${hasInsufficientFunds ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className={hasInsufficientFunds ? 'text-red-700' : 'text-blue-700'}>
                      Cash on Hand:
                    </span>
                    <span
                      className={
                        hasInsufficientFunds
                          ? 'text-red-800 font-medium'
                          : 'text-blue-800 font-medium'
                      }
                    >
                      ${player.cashOnHand.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={hasInsufficientFunds ? 'text-red-700' : 'text-blue-700'}>
                      Remaining:
                    </span>
                    <span
                      className={
                        hasInsufficientFunds
                          ? 'text-red-800 font-medium'
                          : 'text-blue-800 font-medium'
                      }
                    >
                      ${remainingCash.toLocaleString()}
                    </span>
                  </div>
                </div>
                {hasInsufficientFunds && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Insufficient funds for this purchase
                  </p>
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
                disabled={!details.name || totalCost === 0}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Preview Impact
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Impact */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Transaction</h2>
              <p className="text-gray-600">Confirm the financial impact before submitting</p>
            </div>

            <TransactionImpactPreview
              impact={calculateImpact()}
              assetDetails={getAssetDetails()}
              liabilityDetails={getLiabilityDetails()}
            />

            {hasInsufficientFunds && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Warning: This transaction will result in negative cash balance
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Edit Details
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

export default BuyTransactionScreen
