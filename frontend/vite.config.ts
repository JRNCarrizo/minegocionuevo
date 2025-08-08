import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Permite acceso desde cualquier IP
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    allowedHosts: [
      'negocio360-frontend.onrender.com',
      'localhost',
      '127.0.0.1'
    ]
  },
  build: {
    // Optimizaciones para producción
    target: 'es2015', // Compatibilidad con navegadores más antiguos
    minify: 'esbuild', // Minificación rápida y eficiente
    rollupOptions: {
      output: {
        // Separación de chunks para mejor caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['react-hot-toast', 'react-toastify'],
          ui: ['react-barcode'],
        },
        // Optimización de nombres de archivos
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Optimización de assets
    assetsInlineLimit: 4096, // Inline de assets pequeños
    chunkSizeWarningLimit: 1000, // Límite de advertencia de tamaño
    sourcemap: false, // Deshabilitar sourcemaps en producción
  },
  // Optimización de dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Configuración de CSS
  css: {
    devSourcemap: false, // Deshabilitar sourcemaps de CSS en desarrollo
  },
})
