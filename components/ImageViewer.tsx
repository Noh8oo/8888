
import React, { useState, useEffect, useRef } from 'react';
import { Download, Check, Share2, ZoomIn, Loader2, Sparkles, MoveHorizontal } from 'lucide-react';

interface ImageViewerProps {
  imageSrc: string;
  originalSrc?: string | null;
  isEnhancing?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageSrc, originalSrc, isEnhancing = false }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageSrc && !isEnhancing) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [imageSrc, isEnhancing]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || isEnhancing || !originalSrc) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleShareImage = async () => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'lumina-image.png', { type: blob.type });

      if (navigator.share) {
        await navigator.share({ files: [file], title: 'صورة لومينا' });
      }
    } catch (error) {}
  };

  const isComparisonMode = !!originalSrc && originalSrc !== imageSrc && !isEnhancing;

  return (
    <div className="relative group w-full h-full min-h-[400px] flex flex-col select-none">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        className={`relative flex-1 bg-subtle-pattern rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex items-center justify-center p-4 transition-all duration-700 cursor-col-resize ${isEnhancing ? 'brightness-50' : 'brightness-100'}`}
      >
        
        {/* Comparison Logic */}
        {isComparisonMode ? (
          <div className="relative w-full h-full max-h-[600px] flex items-center justify-center">
            {/* After Image (Full background) */}
            <img 
              src={imageSrc} 
              alt="Enhanced" 
              className="max-w-full max-h-full object-contain shadow-md rounded-lg pointer-events-none" 
            />
            
            {/* Before Image (Clipped overlay) */}
            <div 
              className="absolute top-0 left-0 h-full overflow-hidden flex items-center justify-center"
              style={{ width: `${sliderPosition}%`, borderLeft: '2px solid white' }}
            >
              <img 
                src={originalSrc || ''} 
                alt="Original" 
                className="max-w-none h-full object-contain pointer-events-none" 
                style={{ width: containerRef.current?.clientWidth }}
              />
              <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">قبل</div>
            </div>

            {/* Slider Handle */}
            <div 
              className="absolute top-0 bottom-0 z-30 flex flex-col items-center group/handle"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center border-4 border-primary group-hover/handle:scale-110 transition-transform">
                <MoveHorizontal className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute top-4 -translate-x-1/2 left-[50px] bg-primary/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md whitespace-nowrap">بعد (المحسنة)</div>
            </div>
          </div>
        ) : (
          <img 
            src={imageSrc} 
            alt="Preview" 
            className={`max-w-full max-h-[600px] object-contain shadow-md rounded-lg transition-all duration-500 animate-fade-in ${isEnhancing ? 'blur-sm grayscale' : ''}`} 
          />
        )}
        
        {/* Scanner Effect during enhancement */}
        {isEnhancing && (
          <div className="absolute inset-0 z-20 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(30,136,229,0.8)] animate-[scan_2s_linear_infinite]"></div>
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                   <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                   <span className="font-bold text-sm">جاري التحسين الفائق...</span>
                </div>
             </div>
          </div>
        )}
        
        {/* Tooltip for Comparison */}
        {isComparisonMode && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl text-white text-xs font-bold animate-bounce shadow-2xl pointer-events-none">
             اسحب الشريط للمقارنة
          </div>
        )}
        
        {!isEnhancing && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button onClick={handleShareImage} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg shadow-sm"><Share2 className="w-5 h-5" /></button>
             <a href={imageSrc} download="lumina-enhanced.png" className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg shadow-sm"><Download className="w-5 h-5" /></a>
          </div>
        )}
        
        {showSuccess && !isEnhancing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10 animate-fade-in pointer-events-none">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl">
                <Check className="w-8 h-8 text-success animate-bounce" />
             </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};
