/**
 * Mobile Optimizations Component
 * Ensures proper mobile viewport settings and touch targets
 */

import { useEffect } from 'react'

export const MobileOptimizations = () => {
  useEffect(() => {
    // Ensure viewport meta tag is set correctly
    let viewport = document.querySelector('meta[name=viewport]')
    if (!viewport) {
      viewport = document.createElement('meta')
      viewport.setAttribute('name', 'viewport')
      document.head.appendChild(viewport)
    }
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
    )

    // Add touch-action CSS for better mobile scrolling
    const style = document.createElement('style')
    style.textContent = `
      /* Mobile Touch Optimizations */
      * {
        -webkit-tap-highlight-color: transparent;
      }

      button, a, [role="button"] {
        touch-action: manipulation;
        min-height: 44px;
        min-width: 44px;
      }

      /* Ensure inputs are large enough on mobile */
      @media (max-width: 640px) {
        input, select, textarea {
          font-size: 16px !important; /* Prevents zoom on iOS */
          min-height: 44px;
        }

        /* Ensure all interactive elements meet 44x44 minimum */
        button, a, [role="button"], [tabindex]:not([tabindex="-1"]) {
          min-height: 44px;
          min-width: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* Bottom padding for fixed bottom nav */
        body {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      }

      /* Small Android (360px) specific */
      @media (max-width: 360px) {
        .max-w-md {
          max-width: 100% !important;
        }

        .px-6 {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }

        /* Reduce font sizes slightly */
        .text-2xl {
          font-size: 1.5rem !important;
        }

        .text-xl {
          font-size: 1.25rem !important;
        }
      }

      /* iPhone SE/Mini (375px-390px) */
      @media (min-width: 361px) and (max-width: 390px) {
        /* Optimizations for smaller iPhones */
        .grid-cols-3 {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      /* Standard iPhone (390px-428px) */
      @media (min-width: 391px) and (max-width: 428px) {
        /* Default mobile styles work well here */
      }

      /* Safe area insets for modern phones */
      .safe-top {
        padding-top: env(safe-area-inset-top, 0);
      }

      .safe-bottom {
        padding-bottom: env(safe-area-inset-bottom, 0);
      }

      .safe-left {
        padding-left: env(safe-area-inset-left, 0);
      }

      .safe-right {
        padding-right: env(safe-area-inset-right, 0);
      }
    `
    document.head.appendChild(style)

    // Clean up on unmount
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null
}