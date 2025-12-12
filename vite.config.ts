import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // يرفع الحد المسموح به لحجم الملفات لإخفاء التحذير
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // تقسيم المكتبات الكبيرة إلى ملفات منفصلة
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react', '@google/genai'],
        },
      },
    },
  },
  define: {
    // تعريف متغير البيئة بشكل آمن وقت البناء
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY || process.env.API_KEY || '')
  }
});