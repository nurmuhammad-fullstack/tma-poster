import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // Exclude api/ directory — it's Vercel serverless, not frontend code
  server: {
    port: 5174,
  },
});
