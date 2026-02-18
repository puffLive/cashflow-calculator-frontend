import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { selectNotifications, removeNotification } from '@/store/slices/uiSlice'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

/**
 * Toast notification component that displays notifications from Redux store
 */
export const NotificationToast = () => {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(selectNotifications)

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'info':
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800'
      case 'warning':
        return 'bg-amber-50 border-amber-500 text-amber-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-500 text-blue-800'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => dispatch(removeNotification(notification.id))}
          icon={getIcon(notification.type)}
          colors={getColors(notification.type)}
        />
      ))}
    </div>
  )
}

interface NotificationItemProps {
  notification: {
    id: string
    type: string
    message: string
    duration?: number
    actionLabel?: string
    actionPath?: string
  }
  onDismiss: () => void
  icon: React.ReactNode
  colors: string
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  icon,
  colors,
}) => {
  const navigate = useNavigate()

  useEffect(() => {
    const duration = notification.duration || 5000
    const timer = setTimeout(() => {
      onDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [notification.id, notification.duration, onDismiss])

  const handleAction = () => {
    if (notification.actionPath) {
      navigate(notification.actionPath)
      onDismiss()
    }
  }

  return (
    <div
      className={`${colors} border-l-4 p-4 rounded-md shadow-lg pointer-events-auto transition-all duration-300 ease-out`}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
          {notification.actionLabel && notification.actionPath && (
            <button
              onClick={handleAction}
              className="mt-2 text-sm font-semibold underline hover:no-underline focus:outline-none"
            >
              {notification.actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="ml-3 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
