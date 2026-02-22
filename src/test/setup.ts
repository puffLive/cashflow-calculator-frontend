import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
if (typeof process !== 'undefined') {
  process.env.VITE_API_BASE_URL = 'http://localhost:3000/api'
  process.env.VITE_SOCKET_URL = 'http://localhost:3000'
}
