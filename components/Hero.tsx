
import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Wand2, Search } from 'lucide-react';
import { ToolMode } from '../types';

interface HeroProps {
  onImageSelect: (base64: string, mode: ToolMode) => void;
}

export const Hero: React.FC<HeroProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolMode>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (selectedTool && e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], selectedTool);
    }
  }, [selectedTool]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, mode: ToolMode) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], mode);
    }
  };

  const processFile = (file: File, mode: ToolMode) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageSelect(e.target.result as string, mode);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-12 space-y-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-dark dark:text-white leading-tight">
          مختبر <span className="text-primary">لومينا</span> للذكاء الاصطناعي
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
          اختر الأداة المناسبة لعملك وابدأ تجربة التحليل أو التحسين الفوري.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Tool 1: Analysis */}
        <div 
          onClick={() => document.getElementById('fileInputAnalyze')?.click()}
          onDragOver={(e) => { handleDragOver(e); setSelectedTool('analyze'); }}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-8 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group flex flex-col items-center text-center
            ${isDragging && selectedTool === 'analyze' 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
        >
          <input type="file" id="fileInputAnalyze" className="hidden" accept="image/*" onChange={(e) => handleFileInput(e, 'analyze')} />
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-dark dark:text-white mb-3">تحليل الصور المعمق</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
            استخرج الألوان، الأنماط، التخطيط، والبرومبت المخصص لإعادة الإنتاج بذكاء.
          </p>
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <UploadCloud className="w-4 h-4" />
            <span>ارفع للتحليل</span>
          </div>
        </div>

        {/* Tool 2: Enhancement */}
        <div 
          onClick={() => document.getElementById('fileInputEnhance')?.click()}
          onDragOver={(e) => { handleDragOver(e); setSelectedTool('enhance'); }}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-8 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group flex flex-col items-center text-center
            ${isDragging && selectedTool === 'enhance' 
              ? 'border-purple-500 bg-purple-500/5 scale-[1.02]' 
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
        >
          <input type="file" id="fileInputEnhance" className="hidden" accept="image/*" onChange={(e) => handleFileInput(e, 'enhance')} />
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-dark dark:text-white mb-3">تحسين الجودة الاحترافي</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
            ارفع دقة الصورة، أصلح التشويش، وأضف تفاصيل سينمائية فائقة الوضوح (AI Up-scale).
          </p>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ارفع للتحسين</span>
          </div>
          <span className="absolute top-4 left-4 bg-purple-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">PRO</span>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
         <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
            <div className="flex -space-x-3 rtl:space-x-reverse">
               <div className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 bg-red-400 flex items-center justify-center text-white text-xs font-bold">AI</div>
               <div className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 bg-blue-400 flex items-center justify-center text-white text-xs font-bold">2.5</div>
               <div className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 bg-green-400 flex items-center justify-center text-white text-xs font-bold">HD</div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
               مدعوم بأحدث تقنيات <strong>Gemini 2.5</strong> لمعالجة الصور وتوليد المحتوى.
            </p>
         </div>
      </div>
    </div>
  );
};
