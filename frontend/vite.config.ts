import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.1'),
    __APP_LABEL__: JSON.stringify(process.env.VITE_APP_LABEL || 'Vercel Prod'),
  }
})
