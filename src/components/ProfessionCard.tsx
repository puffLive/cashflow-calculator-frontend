import { Briefcase, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import type { Profession } from '@/types/profession'

interface ProfessionCardProps {
  profession: Profession
  isSelected: boolean
  onSelect: () => void
}

const ProfessionCard = ({ profession, isSelected, onSelect }: ProfessionCardProps) => {
  const totalExpenses =
    profession.taxes +
    profession.mortgage +
    profession.schoolLoan +
    profession.carLoan +
    profession.creditCard +
    profession.otherExpenses +
    profession.bankLoan

  const monthlyCashflow = profession.salary - totalExpenses
  const passiveIncomeNeeded = totalExpenses

  const getDifficultyColor = () => {
    switch (profession.difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div
      onClick={onSelect}
      className={`
        cursor-pointer transition-all duration-200 rounded-lg p-4 border-2
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-lg text-gray-800">{profession.title}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor()}`}>
          {profession.difficulty}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">{profession.description}</p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Salary:</span>
          <span className="font-medium">${profession.salary.toLocaleString()}</span>
        </div>

        <div className="flex items-center space-x-1">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600">Cashflow:</span>
          <span className={`font-medium ${monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${monthlyCashflow.toLocaleString()}
          </span>
        </div>

        <div className="col-span-2 flex items-center space-x-1">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-600">Passive Income Needed:</span>
          <span className="font-medium text-yellow-600">${passiveIncomeNeeded.toLocaleString()}</span>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-600 font-medium">✓ Selected</p>
        </div>
      )}
    </div>
  )
}

export default ProfessionCard