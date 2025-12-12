import React, { useState, useEffect } from 'react';
import { Download, Check, Share2, ZoomIn } from 'lucide-react';

interface ImageViewerProps {
  imageSrc: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageSrc }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  // Watch for image updates to show success message (e.g. initial upload)
  useEffect(() => {
    if (imageSrc) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [imageSrc]);

  const handleShareImage = async () => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'lumina-image.png', { type: blob.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'صورة لومينا',
        });
      } else {
        alert('مشاركة الملفات غير مدعومة في هذا المتصفح');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="relative group w-full h-full min-h-[400px] flex flex-col">
      {/* Main Image Container */}
      <div className="relative flex-1 bg-subtle-pattern rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex items-center justify-center p-4 transition-colors duration-300">
        <img 
          src={imageSrc} 
          alt="Uploaded" 
          className="max-w-full max-h-[600px] object-contain shadow-md rounded-lg transition-all duration-500 animate-fade-in" 
        />
        
        {/* Quick Actions Overlay */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <button 
             onClick={handleShareImage}
             className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary shadow-sm"
             title="مشاركة الصورة"
           >
             <Share2 className="w-5 h-5" />
           </button>
           <a 
             href={imageSrc} 
             download="lumina-image.png" 
             className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary shadow-sm"
             title="تحميل الصورة"
           >
             <Download className="w-5 h-5" />
           </a>
        </div>
        
        {/* Helper Badge */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 pointer-events-none">
          <ZoomIn className="w-3 h-3" />
          <span>المعاينة</span>
        </div>
        
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10 animate-fade-in pointer-events-none">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl">
                <Check className="w-8 h-8 text-success animate-bounce" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};