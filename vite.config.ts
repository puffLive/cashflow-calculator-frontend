import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Resolve `@cashflow/shared` to the package's TypeScript source instead
      // of the published CJS `dist/`. The dist uses `require()` / __exportStar
      // and Vite can't surface those as native ES named exports — `import
      // { professions } from '@cashflow/shared'` would fail with "does not
      // provide an export named 'professions'". Pointing at `src/` lets Vite
      // compile on-the-fly and ESM named exports work normally. The backend
      // still consumes the built dist via `npm run build:shared` + the
      // copy-to-server-node_modules step; only the frontend dev/build
      // resolves directly to src.
      '@cashflow/shared': path.resolve(
        __dirname,
        '../cash-flow-backend/shared/src',
      ),
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/screens': path.resolve(__dirname, './src/screens'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/constants': path.resolve(__dirname, './src/constants'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'socket-vendor': ['socket.io-client'],
          'ui-vendor': ['lucide-react', 'clsx'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Keep warning for chunks over 500kb
  },
})
