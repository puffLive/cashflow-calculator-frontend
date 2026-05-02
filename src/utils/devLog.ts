/**
 * Development-only logger. Compiles to a no-op in production builds (Vite
 * inlines `import.meta.env.DEV` at build time, so the bundle either has the
 * console call or doesn't).
 *
 * Use this for chatty operational logs (socket connect/disconnect, event
 * routing, etc.). For real errors, call `console.error` directly — those
 * should make it into production telemetry.
 */
export const devLog = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args)
  }
}
