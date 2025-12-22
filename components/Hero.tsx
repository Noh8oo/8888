
import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Wand2, Search, Palette, Loader2 } from 'lucide-react';
import { ToolMode } from '../types';

interface HeroProps {
  onImageSelect: (base64: string, mode: ToolMode) => void;
}

export const Hero: React.FC<HeroProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolMode>(null);
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);

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
    setIsProcessingLocal(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Simple resizing logic for mobile photos
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600; // Optimal for Gemini while keeping quality
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Export as high quality JPEG to reduce payload size
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        onImageSelect(compressedBase64, mode);
        setIsProcessingLocal(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      {isProcessingLocal && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="font-bold text-dark dark:text-white">جاري تجهيز الصورة...</p>
        </div>
      )}

      <div className="text-center mb-12 space-y-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-dark dark:text-white leading-tight">
          مختبر <span className="text-primary">لومينا</span> للذكاء الاصطناعي
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
          استكشف قدرات الذكاء الاصطناعي في تحليل، تحسين، وتحويل صورك بلمسة واحدة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Tool 1: Analysis */}
        <div 
          onClick={() => document.getElementById('fileInputAnalyze')?.click()}
          onDragOver={(e) => { handleDragOver(e); setSelectedTool('analyze'); }}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-6 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group flex flex-col items-center text-center
            ${isDragging && selectedTool === 'analyze' 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
        >
          <input type="file" id="fileInputAnalyze" className="hidden" accept="image/*" onChange={(e) => handleFileInput(e, 'analyze')} />
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-dark dark:text-white mb-2">تحليل الصور</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-4">
            استخراج الألوان والأنماط والوصف التفصيلي للصورة.
          </p>
          <div className="mt-auto flex items-center gap-2 text-primary font-bold text-xs">
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
          className={`relative p-6 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group flex flex-col items-center text-center
            ${isDragging && selectedTool === 'enhance' 
              ? 'border-purple-500 bg-purple-500/5 scale-[1.02]' 
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
        >
          <input type="file" id="fileInputEnhance" className="hidden" accept="image/*" onChange={(e) => handleFileInput(e, 'enhance')} />
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wand2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-dark dark:text-white mb-2">تحسين الجودة</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-4">
            رفع الدقة وإصلاح التشويش باستخدام تقنيات Super-Res.
          </p>
          <div className="mt-auto flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>ارفع للتحسين</span>
          </div>
        </div>

        {/* Tool 3: Transformation (Artistic Styles) */}
        <div 
          onClick={() => document.getElementById('fileInputTransform')?.click()}
          onDragOver={(e) => { handleDragOver(e); setSelectedTool('transform'); }}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-6 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group flex flex-col items-center text-center
            ${isDragging && selectedTool === 'transform' 
              ? 'border-orange-500 bg-orange-500/5 scale-[1.02]' 
              : 'border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
        >
          <input type="file" id="fileInputTransform" className="hidden" accept="image/*" onChange={(e) => handleFileInput(e, 'transform')} />
          <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Palette className="w-7 h-7 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-dark dark:text-white mb-2">استوديو الفن</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-4">
            تحويل صورك إلى لوحات فنية، أنمي، أو تصاميم ثلاثية الأبعاد.
          </p>
          <div className="mt-auto flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-xs">
            <Palette className="w-4 h-4" />
            <span>ارفع للتلوين</span>
          </div>
          <span className="absolute top-4 left-4 bg-orange-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">جديد</span>
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
               من <strong>نهاد محمد</strong>
            </p>
         </div>
      </div>
    </div>
  );
};
