
import React, { useCallback, useState } from 'react';
import { UploadCloud, Search, Wand2, Palette, Loader2, Sparkles } from 'lucide-react';
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
        const canvas = document.createElement('canvas');
        // Aggressive resizing to stay well under Vercel/API limits (max 1200px width or height)
        let MAX_DIM = 1200; 
        if (mode === 'enhance') MAX_DIM = 1600; // Allow slightly more for enhancement

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
        
        // Export as JPEG with 0.8 quality to ensure small payload size (< 1MB usually)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
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
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="font-bold text-dark dark:text-white">جاري ضغط ومعالجة الصورة...</p>
          <p className="text-xs text-gray-500 mt-2">نعمل على تحسين الحجم لضمان سرعة التحميل</p>
        </div>
      )}

      <div className="text-center mb-12 space-y-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-dark dark:text-white leading-tight">
          مختبر <span className="text-primary">لومينا</span> الذكي
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg font-medium">
          بوابتك المتقدمة لتحليل وتحسين صورك باستخدام أقوى تقنيات الذكاء الاصطناعي.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <ToolCard 
          id="fileInputAnalyze" 
          title="تحليل الصور" 
          desc="استخراج البيانات والألوان والوصف العميق." 
          icon={<Search className="w-7 h-7 text-primary" />}
          colorClass="bg-blue-100 dark:bg-blue-900/30 border-primary"
          onFileSelect={(e) => handleFileInput(e, 'analyze')}
          onDragOver={() => setSelectedTool('analyze')}
        />
        <ToolCard 
          id="fileInputEnhance" 
          title="تحسين الجودة" 
          desc="رفع الدقة وإزالة التشويش بضغطة واحدة." 
          icon={<Wand2 className="w-7 h-7 text-purple-600" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30 border-purple-500"
          onFileSelect={(e) => handleFileInput(e, 'enhance')}
          onDragOver={() => setSelectedTool('enhance')}
        />
        <ToolCard 
          id="fileInputTransform" 
          title="استوديو الفن" 
          desc="تحويل الصور لأنماط فنية إبداعية مذهلة." 
          icon={<Palette className="w-7 h-7 text-orange-600" />}
          colorClass="bg-orange-100 dark:bg-orange-900/30 border-orange-500"
          onFileSelect={(e) => handleFileInput(e, 'transform')}
          onDragOver={() => setSelectedTool('transform')}
          isNew
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 text-center">
         <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            تم تطوير لومينا بواسطة <strong>نهاد محمد</strong> • مدعوم بـ Gemini 2.5
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
  onDragOver: () => void;
  isNew?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ id, title, desc, icon, colorClass, onFileSelect, onDragOver, isNew }) => (
  <div 
    onClick={() => document.getElementById(id)?.click()}
    onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
    className={`relative p-8 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center`}
  >
    <input type="file" id={id} className="hidden" accept="image/*" onChange={onFileSelect} />
    <div className={`w-16 h-16 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-dark dark:text-white mb-2">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">{desc}</p>
    {isNew && <span className="absolute top-6 left-6 bg-orange-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-lg shadow-orange-500/20">جديد</span>}
    <div className="mt-auto px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
      اختر صورة
    </div>
  </div>
);
