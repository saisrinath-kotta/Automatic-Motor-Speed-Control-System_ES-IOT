import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: true
  },
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false
    }
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three'],
          r3f: ['@react-three/fiber'],
          charts: ['recharts'],
          icons: ['lucide-react']
        }
      }
    }
  }
});
