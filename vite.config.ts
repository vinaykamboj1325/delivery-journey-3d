import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Demo site build. The library is built separately by vite.lib.config.ts into dist/.
export default defineConfig({
  build: { outDir: 'dist-demo' },
  plugins: [react()],
})
