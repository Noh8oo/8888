
import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { ToolMode } from '../types';

interface HeroProps {
  onImageSelect: (displayBase64: string, apiBase64: string, mode: ToolMode) => void;
}

export const Hero: React.FC<HeroProps> = ({ onImageSelect }) => {
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, mode: ToolMode) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], mode);
    }
  };

  const resizeImage = (img: HTMLImageElement, maxDim: number, quality: number): string => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    // الحفاظ على النسبة
    if (width > height) {
      if (width > maxDim) {
        height *= maxDim / width;
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width *= maxDim / height;
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }
    return canvas.toDataURL('image/jpeg', quality);
  };

  const processFile = (file: File, mode: ToolMode) => {
    setIsProcessingLocal(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 1. نسخة العرض (جودة عالية للمستخدم)
        const displayBase64 = resizeImage(img, 1024, 0.8);

        // 2. نسخة الـ API (حجم آمن وموحد 512px)
        const apiBase64 = resizeImage(img, 512, 0.6);

        onImageSelect(displayBase64, apiBase64, mode);
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
          <p className="font-bold text-dark dark:text-white">جاري تجهيز الصورة...</p>
        </div>
      )}

      <div className="text-center mb-16 space-y-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-dark dark:text-white leading-tight">
          مختبر <span className="text-primary">لومينا</span> الذكي
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg font-medium">
          أدوات احترافية لتحليل الصور وتحسين جودتها بالذكاء الاصطناعي.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <ToolCard 
          id="fileInputAnalyze" 
          title="تحليل الصور" 
          desc="كشف تفاصيل الصورة، الألوان، النمط، واستخراج وصف دقيق." 
          icon={<Search className="w-8 h-8 text-primary" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30 border-primary"
          onFileSelect={(e) => handleFileInput(e, 'analyze')}
        />
        <ToolCard 
          id="fileInputRemix" 
          title="تحسين الصور" 
          desc="رفع الدقة، إزالة التشويش، وتوضيح التفاصيل (Upscaling)." 
          icon={<Wand2 className="w-8 h-8 text-purple-600" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30 border-purple-500"
          onFileSelect={(e) => handleFileInput(e, 'remix')}
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
    <div className="absolute top-6 right-6">
       {title.includes("تحسين") && <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />}
    </div>
    <h3 className="text-2xl font-bold text-dark dark:text-white mb-3">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">{desc}</p>
    <div className="mt-auto px-10 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
      اضغط هنا للاختيار
    </div>
  </div>
);
