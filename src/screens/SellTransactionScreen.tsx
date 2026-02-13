import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAppSelector } from '@/hooks/redux'
import { useSubmitTransactionMutation } from '@/services/transactionApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import OwnedAssetCard from '@/components/OwnedAssetCard'
import TransactionImpactPreview from '@/components/TransactionImpactPreview'
import type { Asset } from '@/types'

interface SaleDetails {
  pricePerUnit: number
  quantity: number
}

const SellTransactionScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const player = useAppSelector(selectCurrentPlayer)

  const [submitTransaction, { isLoading }] = useSubmitTransactionMutation()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [saleDetails, setSaleDetails] = useState<SaleDetails>({ pricePerUnit: 0, quantity: 1 })

  const handleNext = () => {
    if (step === 1 && selectedAsset) {
      // Pre-fill quantity with max available
      setSaleDetails({ pricePerUnit: 0, quantity: selectedAsset.quantity })
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

  const calculateSaleProceeds = (): number => {
    return saleDetails.pricePerUnit * saleDetails.quantity
  }

  const calculateCapitalGain = (): number => {
    if (!selectedAsset) return 0
    const costBasisPerUnit = selectedAsset.costBasis / selectedAsset.quantity
    return (saleDetails.pricePerUnit - costBasisPerUnit) * saleDetails.quantity
  }

  const calculateImpact = () => {
    if (!selectedAsset) {
      return {
        cashOnHand: { before: player.cashOnHand, after: player.cashOnHand }
      }
    }

    const proceeds = calculateSaleProceeds()
    const cashBefore = player.cashOnHand
    const cashAfter = cashBefore + proceeds

    // Calculate income reduction (if asset generates income)
    const incomeReduction = selectedAsset.monthlyIncome || 0
    const incomeBefore = player.totalIncome

    // For partial sales, scale the income reduction
    const isFull = saleDetails.quantity === selectedAsset.quantity
    const actualIncomeReduction = isFull ? incomeReduction : (incomeReduction * saleDetails.quantity / selectedAsset.quantity)
    const actualIncomeAfter = incomeBefore - actualIncomeReduction

    const paydayBefore = player.paydayAmount
    const paydayAfter = paydayBefore - actualIncomeReduction

    const cashflowBefore = player.cashflow
    const cashflowAfter = cashflowBefore - actualIncomeReduction

    return {
      cashOnHand: { before: cashBefore, after: cashAfter },
      totalIncome: { before: incomeBefore, after: actualIncomeAfter },
      paydayAmount: { before: paydayBefore, after: paydayAfter },
      cashflow: { before: cashflowBefore, after: cashflowAfter }
    }
  }

  const getAssetDetails = (): string => {
    if (!selectedAsset) return ''

    const capitalGain = calculateCapitalGain()
    const gainLossText = capitalGain >= 0 ? `+$${capitalGain.toLocaleString()} gain` : `-$${Math.abs(capitalGain).toLocaleString()} loss`

    return `Selling ${saleDetails.quantity} of ${selectedAsset.name} @ $${saleDetails.pricePerUnit.toLocaleString()}/unit (${gainLossText})`
  }

  const handleSubmit = async () => {
    if (!roomCode || !selectedAsset) return

    const playerId = sessionStorage.getItem('playerId')
    if (!playerId) return

    try {
      await submitTransaction({
        roomCode,
        playerId,
        type: 'sell',
        subType: selectedAsset.type,
        details: {
          assetId: selectedAsset.id,
          assetName: selectedAsset.name,
          quantity: saleDetails.quantity,
          pricePerUnit: saleDetails.pricePerUnit,
          totalProceeds: calculateSaleProceeds()
        } as unknown as Record<string, unknown>
      }).unwrap()

      navigate(`/game/${roomCode}/dashboard`)
    } catch (err) {
      console.error('Failed to submit transaction:', err)
    }
  }

  const capitalGain = calculateCapitalGain()
  const saleProceeds = calculateSaleProceeds()

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
            <h1 className="text-xl font-bold text-gray-800">Sell Asset</h1>
            <div className="text-sm text-gray-500">Step {step}/3</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Asset Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Asset to Sell</h2>
              <p className="text-gray-600">Choose which asset you want to sell</p>
            </div>

            {player.assets.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg mb-4">You don't have any assets to sell</p>
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
                  {player.assets.map((asset) => (
                    <OwnedAssetCard
                      key={asset.id}
                      asset={asset}
                      isSelected={selectedAsset?.id === asset.id}
                      onSelect={() => setSelectedAsset(asset)}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!selectedAsset}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Sale Details */}
        {step === 2 && selectedAsset && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Sale Details</h2>
              <p className="text-gray-600">Enter the sale price and quantity</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* Asset Summary */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">{selectedAsset.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>Available: {selectedAsset.quantity} units</div>
                  <div>Cost Basis: ${selectedAsset.costBasis.toLocaleString()}</div>
                </div>
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Price per Unit *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={saleDetails.pricePerUnit || ''}
                  onChange={(e) => setSaleDetails({ ...saleDetails, pricePerUnit: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Sell *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={saleDetails.quantity}
                  onChange={(e) => setSaleDetails({ ...saleDetails, quantity: Math.min(Number(e.target.value), selectedAsset.quantity) })}
                  max={selectedAsset.quantity}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">Max: {selectedAsset.quantity}</p>
              </div>

              {/* Sale Summary */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Sale Proceeds:</span>
                  <span className="text-2xl font-bold text-green-600">${saleProceeds.toLocaleString()}</span>
                </div>

                <div className={`p-3 rounded-lg ${capitalGain >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex justify-between text-sm">
                    <span className={capitalGain >= 0 ? 'text-green-700' : 'text-red-700'}>Capital Gain/Loss:</span>
                    <span className={`font-bold ${capitalGain >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {capitalGain >= 0 ? '+' : ''}{capitalGain < 0 ? '-' : ''}${Math.abs(capitalGain).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-gray-600">
                    (Sale Price - Cost Basis) × Quantity
                  </p>
                </div>
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
                disabled={saleDetails.pricePerUnit === 0 || saleDetails.quantity === 0}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Preview Impact
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Impact */}
        {step === 3 && selectedAsset && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Transaction</h2>
              <p className="text-gray-600">Confirm the financial impact before submitting</p>
            </div>

            <TransactionImpactPreview
              impact={calculateImpact()}
              assetDetails={getAssetDetails()}
            />

            {/* Capital Gain/Loss Highlight */}
            <div className={`rounded-lg p-4 ${capitalGain >= 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${capitalGain >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {capitalGain >= 0 ? 'Capital Gain' : 'Capital Loss'}
                </span>
                <span className={`text-2xl font-bold ${capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {capitalGain >= 0 ? '+' : ''}{capitalGain < 0 ? '-' : ''}${Math.abs(capitalGain).toLocaleString()}
                </span>
              </div>
            </div>

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

export default SellTransactionScreen