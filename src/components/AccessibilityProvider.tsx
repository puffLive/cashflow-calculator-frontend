import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { announceToScreenReader, addSkipNavigation } from '@/utils/accessibility'

/**
 * Accessibility Provider Component
 * Ensures WCAG 2.1 AA compliance throughout the app
 */
export const AccessibilityProvider = () => {
  const location = useLocation()

  // Announce route changes to screen readers
  useEffect(() => {
    const pageName = getPageName(location.pathname)
    announceToScreenReader(`Navigated to ${pageName}`)
  }, [location.pathname])

  // Add skip navigation and other a11y features on mount
  useEffect(() => {
    // Add skip navigation link
    addSkipNavigation()

    // Add lang attribute to HTML element
    document.documentElement.lang = 'en'

    // Add ARIA landmarks if not present
    const main = document.querySelector('main')
    if (!main) {
      const root = document.getElementById('root')
      if (root) {
        root.setAttribute('role', 'main')
        root.setAttribute('id', 'main-content')
      }
    }

    // Ensure all images have alt text (development warning)
    if (import.meta.env.DEV) {
      const checkImages = () => {
        const images = document.querySelectorAll('img:not([alt])')
        images.forEach((img) => {
          console.warn('Image missing alt text:', img)
          img.setAttribute('alt', '') // Empty alt for decorative images
        })
      }

      // Check periodically in development
      const interval = setInterval(checkImages, 5000)
      return () => clearInterval(interval)
    }
  }, [])

  // Add proper ARIA labels to form controls
  useEffect(() => {
    const addAriaLabels = () => {
      // Add aria-label to inputs without labels
      document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach((input) => {
        const placeholder = input.getAttribute('placeholder')
        if (placeholder) {
          input.setAttribute('aria-label', placeholder)
        }
      })

      // Ensure buttons have accessible names
      document.querySelectorAll('button').forEach((button) => {
        if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
          const title = button.getAttribute('title')
          if (title) {
            button.setAttribute('aria-label', title)
          }
        }
      })

      // Add role="button" to clickable divs
      document.querySelectorAll('[onClick]').forEach((element) => {
        if (element.tagName !== 'BUTTON' && element.tagName !== 'A' && !element.getAttribute('role')) {
          element.setAttribute('role', 'button')
          if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0')
          }
        }
      })
    }

    // Run immediately and on mutations
    addAriaLabels()

    const observer = new MutationObserver(addAriaLabels)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}

// Helper to get readable page names for announcements
function getPageName(pathname: string): string {
  if (pathname === '/') return 'Home page'
  if (pathname.includes('/create')) return 'Create game page'
  if (pathname.includes('/join')) return 'Join game page'
  if (pathname.includes('/dashboard')) return 'Dashboard'
  if (pathname.includes('/lobby')) return 'Game lobby'
  if (pathname.includes('/setup')) return 'Player setup'
  if (pathname.includes('/players')) return 'Players overview'
  if (pathname.includes('/income')) return 'Income details'
  if (pathname.includes('/expenses')) return 'Expense details'
  if (pathname.includes('/assets')) return 'Asset details'
  if (pathname.includes('/liabilities')) return 'Liability details'
  if (pathname.includes('/transaction')) return 'Transaction page'
  if (pathname.includes('/audits')) return 'Pending audits'
  if (pathname.includes('/history')) return 'Transaction history'
  return 'Page'
}