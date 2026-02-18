import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  TrendingDown,
  Building2,
  CreditCard,
  ClipboardCheck
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
    { id: 'audits', label: 'Audits', icon: ClipboardCheck, path: `/game/${roomCode}/audits`, badge: pendingAuditCount },
    { id: 'players', label: 'Players', icon: Users, path: `/game/${roomCode}/players` },
    { id: 'income', label: 'Income', icon: TrendingUp, path: `/game/${roomCode}/income` },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: `/game/${roomCode}/expenses` },
    { id: 'assets', label: 'Assets', icon: Building2, path: `/game/${roomCode}/assets` }
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
              aria-label={`${tab.label}${tab.badge && tab.badge > 0 ? ` (${tab.badge} pending)` : ''}`}
              aria-current={active ? 'page' : undefined}
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
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2.5 h-2.5"></span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavBar