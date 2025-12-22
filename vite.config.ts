
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react', '@google/genai'],
        },
      },
    },
  },
  define: {
    // نضمن تعريف API_KEY للواجهة الأمامية. 
    // ملاحظة لمستخدمي Vercel: يجب إضافة API_KEY في قسم Environment Variables في Vercel Dashboard.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || '')
  }
});
