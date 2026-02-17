import { Calculator, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import type { Profession } from '@/types/profession'

interface FinancialSheetPreviewProps {
  profession: Profession
}

const FinancialSheetPreview = ({ profession }: FinancialSheetPreviewProps) => {
  const totalExpenses =
    profession.taxes +
    profession.mortgage +
    profession.schoolLoan +
    profession.carLoan +
    profession.creditCard +
    profession.otherExpenses +
    profession.bankLoan

  const monthlyCashflow = profession.salary - totalExpenses

  const totalLiabilities =
    profession.mortgage * 150 + // Rough estimate: mortgage principal
    profession.schoolLoan * 60 + // School loan principal
    profession.carLoan * 12 + // Car loan principal
    profession.creditCard * 10 + // Credit card debt
    profession.bankLoan

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-800">Financial Statement Preview</h3>
      </div>

      {/* Income Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h4 className="text-lg font-semibold text-gray-700">Income</h4>
        </div>
        <div className="bg-green-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Salary</span>
            <span className="font-medium text-gray-800">${profession.salary.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Total Income</span>
              <span className="font-bold text-green-600">${profession.salary.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingDown className="w-5 h-5 text-red-500" />
          <h4 className="text-lg font-semibold text-gray-700">Expenses</h4>
        </div>
        <div className="bg-red-50 rounded-lg p-3 space-y-2">
          {[
            { label: 'Taxes', value: profession.taxes },
            { label: 'Home Mortgage', value: profession.mortgage },
            { label: 'School Loan Payment', value: profession.schoolLoan },
            { label: 'Car Loan Payment', value: profession.carLoan },
            { label: 'Credit Card Payment', value: profession.creditCard },
            { label: 'Other Expenses', value: profession.otherExpenses },
            { label: 'Bank Loan Payment', value: profession.bankLoan }
          ].map(({ label, value }) =>
            value > 0 && (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-800">${value.toLocaleString()}</span>
              </div>
            )
          )}
          <div className="pt-2 border-t border-red-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Total Expenses</span>
              <span className="font-bold text-red-600">${totalExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cashflow Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Wallet className="w-5 h-5 text-blue-500" />
          <h4 className="text-lg font-semibold text-gray-700">Monthly Cashflow</h4>
        </div>
        <div className={`${monthlyCashflow >= 0 ? 'bg-blue-50' : 'bg-yellow-50'} rounded-lg p-3`}>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-semibold">Net Cashflow</span>
            <span className={`font-bold text-xl ${monthlyCashflow >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
              ${monthlyCashflow.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Starting Position */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Starting Position</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Starting Cash</span>
            <span className="font-medium">${monthlyCashflow.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Liabilities</span>
            <span className="font-medium text-red-600">${totalLiabilities.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-700 font-semibold">Passive Income Needed</span>
            <span className="font-bold text-yellow-600">${totalExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-xs text-yellow-800">
          <span className="font-semibold">Goal:</span> Build passive income of ${totalExpenses.toLocaleString()}/month to escape the rat race!
        </p>
      </div>
    </div>
  )
}

export default FinancialSheetPreview