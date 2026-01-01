
import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Wand2, MonitorPlay } from 'lucide-react';
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
      // تفعيل خوارزميات التنعيم للحفاظ على الجودة عند تغيير الحجم
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
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
        // 1. نسخة العرض والمعالجة: نرفع الحد الأقصى إلى 4096 للحفاظ على دقة البكسلات الأصلية
        const displayBase64 = resizeImage(img, 4096, 0.95);

        // 2. نسخة الـ API: حجم صغير للتحليل السريع
        const apiBase64 = resizeImage(img, 512, 0.7);

        onImageSelect(displayBase64, apiBase64, mode);
        setIsProcessingLocal(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 select-none">
      {isProcessingLocal && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-6 select-none">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="font-bold text-dark dark:text-white">جاري تجهيز الصورة بأعلى دقة...</p>
        </div>
      )}

      <div className="text-center mb-16 space-y-4">
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-dark dark:text-white leading-tight drop-shadow-sm flex items-center justify-center flex-wrap gap-2">
          <span>مختبر</span>
          <span className="text-primary">لومينا</span>
          <div className="relative inline-flex items-center">
             <span>الذكي</span>
             {/* The Funny 'Very' Badge - Lowered to top-1 for better alignment */}
             <span className="absolute top-1 -left-6 transform -rotate-12 z-20 animate-bounce">
                <span className="bg-yellow-400 text-dark text-[11px] font-black px-3 py-1 rounded-lg border-2 border-white dark:border-gray-800 shadow-md whitespace-nowrap">
                  جداً 🤭
                </span>
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-yellow-400"></span>
             </span>
          </div>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto text-lg font-medium">
          أدوات احترافية لتحليل الصور ومعالجة البكسلات باستخدام الذكاء الاصطناعي.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <ToolCard 
          id="fileInputAnalyze" 
          title="تحليل الصور" 
          desc="كشف تفاصيل الصورة، الألوان، النمط، واستخراج وصف دقيق." 
          icon={<Search className="w-8 h-8 text-primary" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
          onFileSelect={(e) => handleFileInput(e, 'analyze')}
        />
        <ToolCard 
          id="fileInputRemix" 
          title="توضيح ورفع الدقة" 
          desc="رفع الدقة (Upscaling)، توضيح البكسلات، ومعالجة التشويش." 
          icon={<MonitorPlay className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
          colorClass="bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
          onFileSelect={(e) => handleFileInput(e, 'remix')}
        />
      </div>

      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-[2rem] p-8 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
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
    className={`relative p-10 rounded-[2.5rem] border-2 border-dashed hover:border-solid bg-white dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center shadow-sm hover:shadow-strong active:scale-[0.98] ${colorClass}`}
  >
    <input type="file" id={id} className="hidden" accept="image/*" onChange={onFileSelect} />
    <div className={`w-24 h-24 ${colorClass.split(' ')[0]} rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform shadow-inner relative`}>
      {icon}
    </div>
    
    <div className="absolute top-6 right-6">
       {title.includes("توضيح") && <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />}
    </div>
    
    <h3 className="text-2xl font-bold text-dark dark:text-white mb-3">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8 px-4">{desc}</p>
    <div className="mt-auto px-10 py-3.5 bg-gray-100 dark:bg-gray-700 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
      اضغط هنا للاختيار
    </div>
  </div>
);
