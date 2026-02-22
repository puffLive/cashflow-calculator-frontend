import type { LucideIcon } from 'lucide-react'

interface AssetTypeCardProps {
  id: string
  title: string
  description: string
  icon: LucideIcon
  isSelected: boolean
  onSelect: () => void
}

const AssetTypeCard = ({
  title,
  description,
  icon: Icon,
  isSelected,
  onSelect,
}: AssetTypeCardProps) => {
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
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-full ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <Icon className={`w-8 h-8 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        {isSelected && (
          <div className="pt-2">
            <span className="text-xs text-blue-600 font-medium">✓ Selected</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default AssetTypeCard
