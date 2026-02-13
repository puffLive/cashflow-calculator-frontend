import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'

interface SessionExpiredModalProps {
  isOpen: boolean
}

const SessionExpiredModal = ({ isOpen }: SessionExpiredModalProps) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleReturn = () => {
    // Clear session data
    sessionStorage.clear()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 text-center">
        <div className="bg-red-100 rounded-full p-4 inline-flex mb-4">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">Session Expired</h2>

        <p className="text-gray-600 mb-6">
          This game session has ended due to inactivity. All players have been disconnected.
        </p>

        <button
          onClick={handleReturn}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>

        <p className="text-xs text-gray-500 mt-4">
          You can create a new game or join another existing game from the home page.
        </p>
      </div>
    </div>
  )
}

export default SessionExpiredModal
