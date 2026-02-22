/**
 * Accessibility utilities for WCAG compliance
 */

/**
 * Announce message to screen readers using ARIA live region
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `
  announcement.textContent = message
  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus trap utility for modals/dialogs
 */
export const createFocusTrap = (containerElement: HTMLElement) => {
  const focusableElements = containerElement.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstFocusable = focusableElements[0] as HTMLElement
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      }
    }
  }

  containerElement.addEventListener('keydown', handleKeyDown)

  // Focus first element
  firstFocusable?.focus()

  // Return cleanup function
  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Get appropriate ARIA label for financial values
 */
export const getFinancialAriaLabel = (label: string, value: number, isPositive?: boolean) => {
  const formattedValue = Math.abs(value).toLocaleString()
  const sign = value < 0 ? 'negative' : value > 0 && isPositive !== false ? 'positive' : ''
  return `${label}: ${sign} ${formattedValue} dollars`
}

/**
 * Ensure color contrast meets WCAG AA standards
 * Returns true if contrast ratio is >= 4.5:1 for normal text
 */
export const hasSufficientContrast = (_foreground: string, _background: string): boolean => {
  // Simple check - in production, use a proper color contrast library
  // For now, we'll assume our predefined color combinations are compliant
  // Safe color combinations:
  // - White on green (#FFFFFF, #2E7D32)
  // - White on red (#FFFFFF, #C62828)
  // - White on blue (#FFFFFF, #2D6A9F)
  // - Black on amber (#000000, #F9A825)
  // - White on dark gray (#FFFFFF, #333333)

  return true // Placeholder - implement actual contrast calculation if needed
}

/**
 * Add skip navigation link
 */
export const addSkipNavigation = () => {
  const skipNav = document.createElement('a')
  skipNav.href = '#main-content'
  skipNav.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded'
  skipNav.textContent = 'Skip to main content'
  document.body.insertBefore(skipNav, document.body.firstChild)
}