import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * App-level error boundary. Before this existed, any render-time throw
 * (e.g. the TransactionHistoryScreen crash) unmounted the entire tree and
 * left the user staring at a blank white page with no way back.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            This screen hit an unexpected error. Your game is still running — reload to pick up
            where you left off.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Reload
            </button>
            <button
              onClick={this.handleGoHome}
              className="bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
