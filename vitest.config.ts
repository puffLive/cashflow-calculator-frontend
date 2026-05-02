import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules/', 'dist/', 'e2e/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'e2e/',
      ],
    },
  },
  resolve: {
    alias: {
      // Match vite.config.ts — resolve to shared src for native ESM named
      // exports. Without this, vitest would load the CJS dist and break.
      '@cashflow/shared': path.resolve(
        __dirname,
        '../cash-flow-backend/shared/src',
      ),
      '@': path.resolve(__dirname, './src'),
    },
  },
})
