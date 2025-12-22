
import React, { useState } from 'react';
import { Search, Wand2, Loader2 } from 'lucide-react';
import { ToolMode } from '../types';

interface HeroProps {
  onImageSelect: (base64: string, mode: ToolMode) => void;
}

export const Hero: React.FC<HeroProps> = ({ onImageSelect }) => {
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, mode: ToolMode) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], mode);
    }
  };

  const processFile = (file: File, mode: ToolMode) => {
    setIsProcessingLocal(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // تصغير الصورة لـ 256 بكسل فقط عند التحسين لضمان عملها على Vercel
        // التحليل يبقى 512 بكسل لأنه لا يعيد صورة فلا مشكلة في الحجم
        const MAX_DIM = mode === 'enhance' ? 256 : 512; 

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        // جودة منخفضة قليلاً لتقليل حجم الـ Payload لـ Vercel
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
        onImageSelect(compressedBase64, mode);
        setIsProcessingLocal(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      {isProcessingLocal && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="font-bold text-dark dark:text-white">جاري معالجة الصورة...</p>
        </div>
      )}

      <div className="text-center mb-16 space-y-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-dark dark:text-white leading-tight">
          مختبر <span className="text-primary">لومينا</span> الذكي
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg font-medium">
          حلل وحسن صورك مجاناً عبر متصفحك مباشرة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <ToolCard 
          id="fileInputAnalyze" 
          title="تحليل الصور" 
          desc="استخراج النمط والألوان والوصف بدقة عالية." 
          icon={<Search className="w-8 h-8 text-primary" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30 border-primary"
          onFileSelect={(e) => handleFileInput(e, 'analyze')}
        />
        <ToolCard 
          id="fileInputEnhance" 
          title="تحسين الصور" 
          desc="تعديل الإضاءة والوضوح بلمسة واحدة." 
          icon={<Wand2 className="w-8 h-8 text-purple-600" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30 border-purple-500"
          onFileSelect={(e) => handleFileInput(e, 'enhance')}
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-700 text-center">
         <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            تم التطوير بواسطة <strong>نهاد محمد</strong>
         </p>
      </div>
    </div>
  );
};

interface ToolCardProps {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  colorClass: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ id, title, desc, icon, colorClass, onFileSelect }) => (
  <div 
    onClick={() => document.getElementById(id)?.click()}
    className={`relative p-10 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center shadow-sm hover:shadow-2xl`}
  >
    <input type="file" id={id} className="hidden" accept="image/*" onChange={onFileSelect} />
    <div className={`w-20 h-20 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform shadow-inner`}>
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-dark dark:text-white mb-3">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">{desc}</p>
    <div className="mt-auto px-10 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
      اضغط هنا للاختيار
    </div>
  </div>
);
