import type { ReactNode } from 'react'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

interface KeyboardNavigationProviderProps {
  children: ReactNode
}

export const KeyboardNavigationProvider = ({ children }: KeyboardNavigationProviderProps) => {
  // Initialize keyboard navigation
  useKeyboardNavigation()

  return <>{children}</>
}