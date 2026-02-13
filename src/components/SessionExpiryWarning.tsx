import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { selectExpiryWarning, hideExpiryWarning } from '@/store/slices/uiSlice'
import { AlertTriangle, X } from 'lucide-react'

const SessionExpiryWarning = () => {
  const dispatch = useAppDispatch()
  const { visible, minutesRemaining } = useAppSelector(selectExpiryWarning)
  const [secondsLeft, setSecondsLeft] = useState(minutesRemaining * 60)

  useEffect(() => {
    if (visible) {
      setSecondsLeft(minutesRemaining * 60)

      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [visible, minutesRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white shadow-lg">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Session Expiring Soon</p>
            <p className="text-xs text-amber-100">
              Session will expire in {formatTime(secondsLeft)} due to inactivity. Make any action to keep playing.
            </p>
          </div>
        </div>
        <button
          onClick={() => dispatch(hideExpiryWarning())}
          className="p-1 hover:bg-amber-600 rounded-lg transition-colors flex-shrink-0"
          aria-label="Dismiss warning"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default SessionExpiryWarning
