
import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2, MoveHorizontal, Maximize2, SplitSquareVertical, X, Download } from 'lucide-react';

interface ImageViewerProps {
  imageSrc: string;
  originalSrc?: string | null;
  isEnhancing?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageSrc, originalSrc, isEnhancing = false }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isComparisonActive, setIsComparisonActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageSrc && !isEnhancing) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [imageSrc, isEnhancing]);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || isEnhancing || !isComparisonActive || !originalSrc) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const isComparisonAvailable = !!originalSrc && originalSrc !== imageSrc && !isEnhancing;

  const toggleFullscreen = () => {
    if (isEnhancing) return;
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div className="relative group w-full flex flex-col select-none">
        <div 
          ref={containerRef}
          onMouseMove={handleInteraction}
          onTouchMove={handleInteraction}
          className={`relative w-full aspect-[4/3] md:aspect-auto md:min-h-[500px] lg:h-[75vh] lg:max-h-[800px] bg-subtle-pattern rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-all duration-700 ${isEnhancing ? 'brightness-50' : 'brightness-100'} ${isComparisonActive ? 'cursor-col-resize' : 'cursor-default shadow-2xl'}`}
        >
          
          {isComparisonAvailable && isComparisonActive ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img src={imageSrc} alt="Enhanced" className="w-full h-full object-contain pointer-events-none" />
              <div 
                className="absolute top-0 left-0 h-full overflow-hidden flex items-center justify-center"
                style={{ width: `${sliderPosition}%`, borderRight: '4px solid white' }}
              >
                <img 
                  src={originalSrc || ''} 
                  alt="Original" 
                  className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-full h-full object-contain pointer-events-none" 
                  style={{ width: containerRef.current?.clientWidth, maxWidth: 'none' }}
                />
                <div className="absolute top-6 right-6 bg-black/60 text-white text-[11px] px-4 py-2 rounded-full backdrop-blur-md font-bold z-20 border border-white/20 shadow-lg">الصورة الأصلية</div>
              </div>

              <div className="absolute top-0 bottom-0 z-30 flex flex-col items-center" style={{ left: `${sliderPosition}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_0_30px_rgba(30,136,229,0.5)] flex items-center justify-center border-4 border-primary transition-transform hover:scale-110 active:scale-90">
                  <MoveHorizontal className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>
          ) : (
            <img 
              src={imageSrc} 
              alt="Preview" 
              className={`w-full h-full object-contain transition-all duration-500 animate-fade-in ${isEnhancing ? 'blur-sm grayscale scale-95' : 'scale-100'}`} 
            />
          )}
          
          {isEnhancing && (
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
               <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_25px_rgba(30,136,229,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
               <div className="flex flex-col items-center animate-pulse">
                  <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
                  <div className="bg-primary/90 px-8 py-3 rounded-2xl backdrop-blur-lg shadow-2xl border border-white/20">
                     <span className="font-bold text-white text-base">جاري التحسين الفائق...</span>
                  </div>
               </div>
            </div>
          )}

          {!isEnhancing && (
            <div className="absolute top-6 inset-x-6 flex justify-between items-start pointer-events-none z-10">
              {isComparisonAvailable && (
                <button 
                  onClick={() => setIsComparisonActive(!isComparisonActive)}
                  className={`pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl backdrop-blur-xl border transition-all shadow-2xl active:scale-95
                    ${isComparisonActive 
                      ? 'bg-primary text-white border-primary shadow-primary/40' 
                      : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-700 hover:bg-white'
                    }`}
                >
                  <SplitSquareVertical className="w-5 h-5" />
                  <span className="text-[12px] font-bold">{isComparisonActive ? 'إغلاق المقارنة' : 'مقارنة مع الأصل'}</span>
                </button>
              )}
              
              <button 
                onClick={toggleFullscreen}
                className="pointer-events-auto p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 hover:text-primary transition-all active:scale-90"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {showSuccess && !isEnhancing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[4px] z-10 animate-fade-in pointer-events-none">
               <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl border border-success/30 scale-125">
                  <Check className="w-14 h-14 text-success animate-bounce" />
               </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes scan {
            0% { top: 0; opacity: 0.3; }
            50% { top: 95%; opacity: 1; }
            100% { top: 0; opacity: 0.3; }
          }
        `}</style>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <button 
            onClick={toggleFullscreen}
            className="absolute top-6 right-6 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-10 h-10" />
          </button>
          
          <img 
            src={imageSrc} 
            alt="Fullscreen View" 
            className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(30,136,229,0.3)] rounded-lg"
          />
          
          <div className="absolute bottom-10 inset-x-0 flex justify-center gap-4">
            <a 
              href={imageSrc} 
              download="lumina_fullscreen.png"
              className="bg-primary text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Download className="w-6 h-6" /> تحميل الصورة كاملة
            </a>
          </div>
        </div>
      )}
    </>
  );
};
