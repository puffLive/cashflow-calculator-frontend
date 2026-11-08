#!/usr/bin/env node
/**
 * Refresh the vendored copy of @cashflow/shared from the backend repo.
 *
 * The frontend used to depend on `file:../cash-flow-backend/shared`, which
 * only exists on a machine with both repos checked out side by side, so the
 * frontend could not build on a host like Vercel. Instead, a built copy of
 * the shared package lives in vendor/cashflow-shared and is committed here.
 * Run this script whenever the backend's shared/ code changes:
 *
 *   npm run sync:shared                      # finds ../cashflow-backend or ../cash-flow-backend
 *   npm run sync:shared -- /path/to/backend  # or point at the backend repo (or its shared/ folder)
 *   CASHFLOW_BACKEND_DIR=/path npm run sync:shared
 *
 * It compiles the backend's shared/ with this repo's TypeScript, then copies
 * src/ (which Vite and Vitest compile directly) and dist/ (the types that
 * `tsc -b` checks against) into vendor/cashflow-shared, and records the
 * backend commit it came from in vendor/cashflow-shared/SOURCE.json.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VENDOR_DIR = path.join(ROOT, 'vendor', 'cashflow-shared')

function findSharedDir() {
  const candidates = [
    process.argv[2],
    process.env.CASHFLOW_BACKEND_DIR,
    path.join(ROOT, '..', 'cashflow-backend'),
    path.join(ROOT, '..', 'cash-flow-backend'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    const dir = path.resolve(candidate)
    for (const shared of [dir, path.join(dir, 'shared')]) {
      const pkg = path.join(shared, 'package.json')
      if (
        fs.existsSync(pkg) &&
        JSON.parse(fs.readFileSync(pkg, 'utf8')).name === '@cashflow/shared'
      ) {
        return shared
      }
    }
  }
  console.error(
    'Could not find the backend shared package. Looked in:\n' +
      candidates.map((c) => `  ${path.resolve(c)}`).join('\n') +
      '\nPass the backend repo path: npm run sync:shared -- /path/to/cashflow-backend'
  )
  process.exit(1)
}

function gitInfo(dir) {
  const git = (...args) => {
    try {
      return execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim()
    } catch {
      return null
    }
  }
  const status = git('status', '--porcelain', '--', '.')
  return {
    commit: git('rev-parse', 'HEAD'),
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    uncommittedChanges: status === null ? null : status.length > 0,
  }
}

function copyDir(from, to, skip = () => false) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    const target = path.join(to, entry.name)
    if (skip(entry.name)) continue
    if (entry.isDirectory()) copyDir(source, target, skip)
    else fs.copyFileSync(source, target)
  }
}

const sharedDir = findSharedDir()
console.log(`Building ${sharedDir}`)

// Build with this repo's TypeScript (or the backend's, before this repo's
// first npm install) so the backend needs no npm install of its own
const tsc = [ROOT, path.dirname(sharedDir), sharedDir]
  .map((dir) => path.join(dir, 'node_modules', 'typescript', 'bin', 'tsc'))
  .find((file) => fs.existsSync(file))
if (!tsc) {
  console.error('TypeScript is not installed: run npm install first.')
  process.exit(1)
}
fs.rmSync(path.join(sharedDir, 'dist'), { recursive: true, force: true })
execFileSync(process.execPath, [tsc, '-p', path.join(sharedDir, 'tsconfig.json')], {
  stdio: 'inherit',
})

fs.rmSync(VENDOR_DIR, { recursive: true, force: true })
copyDir(path.join(sharedDir, 'src'), path.join(VENDOR_DIR, 'src'))
copyDir(
  path.join(sharedDir, 'dist'),
  path.join(VENDOR_DIR, 'dist'),
  (name) => name.endsWith('.map') || name.endsWith('.tsbuildinfo')
)

const sourcePkg = JSON.parse(fs.readFileSync(path.join(sharedDir, 'package.json'), 'utf8'))
const vendorPkg = {
  name: sourcePkg.name,
  version: sourcePkg.version,
  description: `${sourcePkg.description} (vendored copy: run npm run sync:shared to refresh)`,
  private: true,
  main: sourcePkg.main,
  types: sourcePkg.types,
}
fs.writeFileSync(path.join(VENDOR_DIR, 'package.json'), `${JSON.stringify(vendorPkg, null, 2)}\n`)

const source = { package: `${sourcePkg.name}@${sourcePkg.version}`, ...gitInfo(sharedDir) }
fs.writeFileSync(path.join(VENDOR_DIR, 'SOURCE.json'), `${JSON.stringify(source, null, 2)}\n`)

console.log(
  `Vendored ${source.package} from commit ${source.commit ?? 'unknown'} into vendor/cashflow-shared`
)
if (source.uncommittedChanges) {
  console.warn(
    'Warning: the backend shared/ folder has uncommitted changes; commit them there too.'
  )
}
console.log(
  'Next: npm install (refreshes node_modules/@cashflow/shared), then commit vendor/ and package-lock.json.'
)
