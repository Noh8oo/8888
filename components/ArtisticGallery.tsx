
import React from 'react';
import { RemixStyle } from '../types';
import { Sparkles } from 'lucide-react';

interface ArtisticGalleryProps {
  styles: RemixStyle[];
  onSelect: (style: RemixStyle) => void;
}

export const ArtisticGallery: React.FC<ArtisticGalleryProps> = ({ styles, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in">
      {styles.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelect(style)}
          className="group relative h-72 rounded-[2.5rem] overflow-hidden text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl focus:outline-none ring-offset-4 focus:ring-2 ring-primary/50 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          {/* Main Background Tint */}
          <div className={`absolute inset-0 ${style.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
          
          {/* Animated Blob Effect */}
          <div className={`absolute -top-24 -right-24 w-48 h-48 ${style.color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 group-hover:scale-150 transition-all duration-700`} />
          
          {/* Bottom Gradient for Text Legibility */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-800 dark:via-gray-800/80 pointer-events-none" />

          {/* Content Container */}
          <div className="relative h-full flex flex-col items-center p-6 z-10">
            
            {/* Icon Container */}
            <div className="mt-2 mb-4 relative">
              <div className={`absolute inset-0 ${style.color} blur-xl opacity-20 rounded-full group-hover:opacity-50 transition-opacity duration-500 scale-150`} />
              <div className="relative w-20 h-20 bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 flex items-center justify-center text-4xl transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 border border-gray-50 dark:border-gray-700">
                {style.icon}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 group-hover:text-primary transition-colors relative z-20">
              {style.name}
            </h3>
            
            <p className="text-[10px] text-gray-400 font-medium mb-auto px-4 leading-relaxed relative z-20">
               اضغط لتطبيق نمط {style.name} وإعادة تخيل الصورة بالكامل
            </p>

            {/* Action Button */}
            <div className={`mt-4 w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300
              bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 group-hover:bg-primary group-hover:text-white shadow-sm group-hover:shadow-lg group-hover:shadow-primary/30 relative z-20`}
            >
              <span>تطبيق النمط</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
