
import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { ToolMode } from '../types';

interface HeroProps {
  onImageSelect: (displayBase64: string, apiBase64: string, mode: ToolMode) => void;
}

export const Hero: React.FC<HeroProps> = ({ onImageSelect }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const resizeImage = (img: HTMLImageElement, maxDim: number, quality: number): string => {
    const canvas = document.createElement('canvas');
    let { width, height } = img;
    if (width > height) { if (width > maxDim) { height *= maxDim / width; width = maxDim; } } 
    else { if (height > maxDim) { width *= maxDim / height; height = maxDim; } }
    
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, mode: ToolMode) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // High Res for UI & Canvas Editing
        const display = resizeImage(img, 1500, 0.9);
        // Low Res for Fast API Analysis
        const api = resizeImage(img, 512, 0.6);
        onImageSelect(display, api, mode);
        setIsProcessing(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 text-center">
      {isProcessing && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur z-50 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
          <p className="font-bold">جاري تجهيز الصورة...</p>
        </div>
      )}

      <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display text-dark dark:text-white">
        مختبر <span className="text-primary">لومينا</span> الذكي
      </h1>
      <p className="text-gray-500 mb-12">تحليل وتحسين الصور بدقة عالية</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <ToolCard 
          title="تحليل شامل" 
          desc="كشف تفاصيل الصورة والألوان" 
          icon={<Search className="w-8 h-8 text-blue-600" />} 
          color="bg-blue-50 dark:bg-blue-900/20"
          onClick={() => document.getElementById('inpAnalyze')?.click()} 
        />
        <input type="file" id="inpAnalyze" hidden accept="image/*" onChange={(e) => handleFile(e, 'analyze')} />

        <ToolCard 
          title="تحسين ومحاكاة" 
          desc="تعديل الإضاءة والفلاتر" 
          icon={<Wand2 className="w-8 h-8 text-purple-600" />} 
          color="bg-purple-50 dark:bg-purple-900/20"
          onClick={() => document.getElementById('inpRemix')?.click()} 
        />
        <input type="file" id="inpRemix" hidden accept="image/*" onChange={(e) => handleFile(e, 'remix')} />
      </div>
    </div>
  );
};

const ToolCard = ({ title, desc, icon, color, onClick }: any) => (
  <div onClick={onClick} className={`p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer flex flex-col items-center gap-4 group`}>
    <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition`}>{icon}</div>
    <div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  </div>
);
