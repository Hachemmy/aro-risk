import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Toute la famille /api est relayée vers le backend Express (port 4000).
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
});
