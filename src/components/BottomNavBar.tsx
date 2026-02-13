import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  TrendingDown,
  Building2,
  CreditCard
} from 'lucide-react'

interface BottomNavBarProps {
  pendingAuditCount?: number
}

const BottomNavBar = ({ pendingAuditCount = 0 }: BottomNavBarProps) => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const location = useLocation()

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: `/game/${roomCode}/dashboard` },
    { id: 'players', label: 'Players', icon: Users, path: `/game/${roomCode}/players`, badge: pendingAuditCount },
    { id: 'income', label: 'Income', icon: TrendingUp, path: `/game/${roomCode}/income` },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: `/game/${roomCode}/expenses` },
    { id: 'assets', label: 'Assets', icon: Building2, path: `/game/${roomCode}/assets` },
    { id: 'liabilities', label: 'Debts', icon: CreditCard, path: `/game/${roomCode}/liabilities` }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-6 gap-1 px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.path)

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`
                flex flex-col items-center justify-center py-2 px-1 rounded-lg relative
                transition-colors duration-200
                ${active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-5 h-5 mb-1 ${active ? 'stroke-2' : ''}`} />
              <span className={`text-xs ${active ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {tab.badge && tab.badge > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavBar