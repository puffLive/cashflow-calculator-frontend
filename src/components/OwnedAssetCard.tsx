import { TrendingUp, Building2, Coins, Gem, Briefcase, PieChart } from 'lucide-react'
import type { Asset } from '@/types'

interface OwnedAssetCardProps {
  asset: Asset
  isSelected: boolean
  onSelect: () => void
}

const AssetIcon = ({ assetType, isSelected }: { assetType: Asset['type']; isSelected: boolean }) => {
  const Icon = (() => {
    switch (assetType) {
      case 'stock':
        return TrendingUp
      case 'mutual_fund':
        return PieChart
      case 'cd':
        return Coins
      case 'real_estate':
        return Building2
      case 'gold':
        return Gem
      case 'business':
        return Briefcase
      default:
        return TrendingUp
    }
  })()

  return (
    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
      <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
    </div>
  )
}

const getAssetTypeLabel = (assetType: Asset['type']) => {
  switch (assetType) {
    case 'stock':
      return 'Stock'
    case 'mutual_fund':
      return 'Mutual Fund'
    case 'cd':
      return 'CD'
    case 'real_estate':
      return 'Real Estate'
    case 'gold':
      return 'Gold'
    case 'business':
      return 'Business'
    default:
      return assetType
  }
}

const OwnedAssetCard = ({ asset, isSelected, onSelect }: OwnedAssetCardProps) => {
  return (
    <div
      onClick={onSelect}
      className={`
        cursor-pointer transition-all duration-200 rounded-lg p-4 border-2
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-start space-x-3">
        <AssetIcon assetType={asset.type} isSelected={isSelected} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-800">{asset.name}</h3>
              <p className="text-xs text-gray-500">{getAssetTypeLabel(asset.type)}</p>
            </div>
            {isSelected && <span className="text-xs text-blue-600 font-medium">✓</span>}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Quantity:</span>
              <span className="ml-1 font-medium text-gray-800">{asset.quantity}</span>
            </div>
            <div>
              <span className="text-gray-500">Cost Basis:</span>
              <span className="ml-1 font-medium text-gray-800">
                ${asset.costBasis.toLocaleString()}
              </span>
            </div>
            {asset.monthlyIncome && asset.monthlyIncome > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Monthly Income:</span>
                <span className="ml-1 font-medium text-green-600">
                  ${asset.monthlyIncome.toLocaleString()}/mo
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnedAssetCard
