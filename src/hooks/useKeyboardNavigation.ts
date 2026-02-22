import { useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * Custom hook for keyboard navigation support
 * Provides keyboard shortcuts for common actions
 */
export const useKeyboardNavigation = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return
      }

      // Check for modifier keys
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey

      // Global shortcuts (work anywhere)
      if (event.key === 'Escape') {
        // Close modals or go back
        const modals = document.querySelectorAll('[role="dialog"]')
        if (modals.length > 0) {
          // Let modal handle its own close
          return
        }
        // Otherwise go back in history
        navigate(-1)
        return
      }

      // Navigation shortcuts (with Alt key)
      if (event.altKey && roomCode) {
        switch (event.key) {
          case 'd':
          case 'D':
            event.preventDefault()
            navigate(`/game/${roomCode}/dashboard`)
            break
          case 'p':
          case 'P':
            event.preventDefault()
            navigate(`/game/${roomCode}/players`)
            break
          case 'h':
          case 'H':
            event.preventDefault()
            navigate(`/game/${roomCode}/history`)
            break
          case 'a':
          case 'A':
            event.preventDefault()
            navigate(`/game/${roomCode}/audits`)
            break
          case 't':
          case 'T':
            event.preventDefault()
            // Open transaction menu
            const fab = document.querySelector('[aria-label*="transaction menu"]') as HTMLElement
            if (fab) {
              fab.click()
            }
            break
        }
      }

      // Quick actions (no modifier)
      if (!hasModifier && roomCode) {
        switch (event.key) {
          case '1':
            navigate(`/game/${roomCode}/income`)
            break
          case '2':
            navigate(`/game/${roomCode}/expenses`)
            break
          case '3':
            navigate(`/game/${roomCode}/assets`)
            break
          case '4':
            navigate(`/game/${roomCode}/liabilities`)
            break
          case '?':
            // Show keyboard shortcuts help
            showKeyboardHelp()
            break
        }
      }

      // Form navigation (Tab is handled by browser)
      // Arrow keys for list navigation
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const focusableElements = document.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        const currentIndex = Array.from(focusableElements).indexOf(
          document.activeElement as HTMLElement
        )

        if (currentIndex !== -1) {
          let nextIndex = currentIndex
          if (event.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % focusableElements.length
          } else {
            nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length
          }
          (focusableElements[nextIndex] as HTMLElement).focus()
          event.preventDefault()
        }
      }
    },
    [navigate, roomCode]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  return {
    // Expose any methods if needed
  }
}

// Helper function to show keyboard shortcuts
const showKeyboardHelp = () => {
  const helpText = `
Keyboard Shortcuts:
━━━━━━━━━━━━━━━━━━
Navigation (Alt + Key):
• Alt+D: Dashboard
• Alt+P: Players
• Alt+H: History
• Alt+A: Audits
• Alt+T: Transactions

Quick Access (Number Keys):
• 1: Income Details
• 2: Expense Details
• 3: Asset Details
• 4: Liability Details

General:
• Escape: Go back / Close
• Tab: Next field
• Shift+Tab: Previous field
• ?: Show this help
  `.trim()

  // Create a temporary notification or modal
  const helpModal = document.createElement('div')
  helpModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
  helpModal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
      <pre class="text-sm text-gray-700 whitespace-pre-wrap">${helpText}</pre>
      <button class="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
        Close (Esc)
      </button>
    </div>
  `

  document.body.appendChild(helpModal)

  const closeHelp = () => {
    document.body.removeChild(helpModal)
  }

  helpModal.querySelector('button')?.addEventListener('click', closeHelp)
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) closeHelp()
  })

  // Close on Escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeHelp()
      window.removeEventListener('keydown', handleEscape)
    }
  }
  window.addEventListener('keydown', handleEscape)
}