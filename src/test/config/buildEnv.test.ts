import { describe, it, expect } from 'vitest'
import { checkBuildEnv, formatBuildEnvError } from '../../config/buildEnv'

const valid = {
  VITE_API_BASE_URL: 'https://api.example.com/api',
  VITE_SOCKET_URL: 'https://api.example.com',
}

describe('checkBuildEnv', () => {
  it('accepts absolute http(s) URLs for both variables', () => {
    expect(checkBuildEnv(valid)).toEqual([])
    expect(
      checkBuildEnv({
        VITE_API_BASE_URL: 'http://localhost:3000/api',
        VITE_SOCKET_URL: 'http://localhost:3000',
      })
    ).toEqual([])
  })

  it('reports each missing variable', () => {
    expect(checkBuildEnv({})).toEqual([
      'VITE_API_BASE_URL is not set',
      'VITE_SOCKET_URL is not set',
    ])
    expect(checkBuildEnv({ ...valid, VITE_SOCKET_URL: '   ' })).toEqual([
      'VITE_SOCKET_URL is not set',
    ])
  })

  it('rejects relative or non-http URLs', () => {
    expect(checkBuildEnv({ ...valid, VITE_API_BASE_URL: '/api' })).toEqual([
      'VITE_API_BASE_URL must be an absolute URL, got "/api"',
    ])
    expect(checkBuildEnv({ ...valid, VITE_SOCKET_URL: 'ws://api.example.com' })).toEqual([
      'VITE_SOCKET_URL must start with http:// or https://, got "ws://api.example.com"',
    ])
  })
})

describe('formatBuildEnvError', () => {
  it('lists the problems and how to fix them', () => {
    const message = formatBuildEnvError(['VITE_API_BASE_URL is not set'])
    expect(message).toContain('  - VITE_API_BASE_URL is not set')
    expect(message).toContain('Environment Variables')
  })
})
