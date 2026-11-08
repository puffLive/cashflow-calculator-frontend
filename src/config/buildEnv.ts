/**
 * Environment variables a production build must be given. Without them the
 * app would silently talk to http://localhost:3000, which on a player's
 * phone means "nothing works" with no clue why. Used by vite.config.ts.
 */
export const REQUIRED_BUILD_ENV = ['VITE_API_BASE_URL', 'VITE_SOCKET_URL'] as const

/** Returns one message per problem; an empty list means the build may go ahead. */
export function checkBuildEnv(env: Record<string, string | undefined>): string[] {
  const problems: string[] = []
  for (const name of REQUIRED_BUILD_ENV) {
    const value = env[name]?.trim()
    if (!value) {
      problems.push(`${name} is not set`)
      continue
    }
    let url: URL
    try {
      url = new URL(value)
    } catch {
      problems.push(`${name} must be an absolute URL, got "${value}"`)
      continue
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      problems.push(`${name} must start with http:// or https://, got "${value}"`)
    }
  }
  return problems
}

export function formatBuildEnvError(problems: string[]): string {
  return [
    'Cannot build the frontend for production:',
    ...problems.map((problem) => `  - ${problem}`),
    'Set them to the deployed backend, e.g.',
    '  VITE_API_BASE_URL=https://your-backend.up.railway.app/api',
    '  VITE_SOCKET_URL=https://your-backend.up.railway.app',
    'In Vercel: Project Settings > Environment Variables. Locally: .env.production.local.',
  ].join('\n')
}
