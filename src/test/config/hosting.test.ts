import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '../../..')
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))

describe('hosting config', () => {
  it('rewrites every deep link to index.html so routes like /game/ABC123/dashboard load', () => {
    const vercel = readJson('vercel.json')
    expect(vercel.outputDirectory).toBe('dist')
    expect(vercel.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' })
  })

  it('builds from the vendored shared package, not a sibling backend checkout', () => {
    const pkg = readJson('package.json')
    expect(pkg.dependencies['@cashflow/shared']).toBe('file:./vendor/cashflow-shared')
    const vendored = readJson('vendor/cashflow-shared/package.json')
    expect(vendored.name).toBe('@cashflow/shared')
    expect(fs.existsSync(path.join(root, 'vendor/cashflow-shared', vendored.types))).toBe(true)
    expect(fs.existsSync(path.join(root, 'vendor/cashflow-shared/src/index.ts'))).toBe(true)
  })
})
