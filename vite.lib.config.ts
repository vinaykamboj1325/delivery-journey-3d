import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

/** Library build: `npm run build:lib` → dist/ with ESM + CJS, types and styles.css */
export default defineConfig({
  plugins: [react(), dts({ include: ['src/lib'], outDir: 'dist', tsconfigPath: './tsconfig.app.json', entryRoot: 'src/lib' })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    sourcemap: true,
    cssFileName: 'styles',
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'DeliveryJourney3D',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // Hosts bring their own React and three.js so there is only one copy of each.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'three', '@react-three/fiber', '@react-three/drei'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM', three: 'THREE' },
      },
    },
  },
})
