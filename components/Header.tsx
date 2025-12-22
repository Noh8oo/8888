
import React, { useState, useEffect } from 'react';
import { Heart, Zap, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  highlightSupport?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, highlightSupport = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLitUp, setIsLitUp] = useState(false);

  // Trigger highlight effect when results are ready
  useEffect(() => {
    if (highlightSupport) {
      setIsLitUp(true);
      // Increased duration to 15 seconds as requested
      const timer = setTimeout(() => setIsLitUp(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [highlightSupport]);

  const handleSupportClick = () => {
    // If user interacts with the button, we can stop the aggressive glow
    setIsLitUp(false);
  };

  return (
    <header className="w-full h-20 flex items-center justify-between px-4 sm:px-6 md:px-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 transition-colors duration-300">
      {/* Support / Donate Button */}
      <a 
        href="https://ko-fi.com/noh8o"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleSupportClick}
        aria-label="ادعم تطوير لومينا عبر Ko-fi"
        className={`relative overflow-hidden flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all duration-500 group hover:scale-105 active:scale-95
          ${isLitUp 
            ? 'bg-rose-600 text-white border-rose-500 animate-glow-pulse ring-4 ring-rose-500/20' 
            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-transparent hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] dark:hover:bg-rose-700'
          }`}
        title="ادعم تطوير الموقع"
      >
        {/* Shine Overlay Effect */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-xl">
          <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-white/20 skew-x-[-25deg] group-hover:animate-shine"></div>
        </div>

        <Heart 
          aria-hidden="true"
          className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 
          ${isLitUp ? 'fill-current animate-bounce' : 'group-hover:fill-current group-hover:scale-110'}`} 
        />
        <span className="font-bold text-xs sm:text-sm">ادعمنا</span>
      </a>
      
      <div className="flex items-center gap-2 sm:gap-4">
         <button 
           onClick={toggleDarkMode} 
           aria-label={isDarkMode ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
           className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
           title={isDarkMode ? "الوضع الفاتح" : "الوضع الداكن"}
         >
           {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
         </button>
         
         <div 
           className="group relative flex items-center gap-2 cursor-pointer"
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}
           role="img"
           aria-label="شعار لومينا"
         >
            {/* Logo Container */}
            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-lg transition-all duration-300 z-10 
              ${isHovered ? 'bg-primary shadow-primary/60 scale-110' : 'bg-primary shadow-primary/30'}
            `}>
              <Zap 
                aria-hidden="true"
                className={`w-5 h-5 text-white transition-all duration-100 ${isHovered ? 'animate-shiver' : ''}`} 
                fill="currentColor" 
              />
              <div className={`absolute inset-0 bg-primary blur-md rounded-lg transition-opacity duration-300 ${isHovered ? 'opacity-70' : 'opacity-0'}`}></div>
            </div>

            {/* Particles / Sparks */}
            {isHovered && (
              <>
                <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-400 rounded-full animate-shoot" style={{ '--tw-translate-x': '15px', '--tw-translate-y': '-15px' } as React.CSSProperties}></div>
                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-blue-300 rounded-full animate-shoot" style={{ '--tw-translate-x': '-15px', '--tw-translate-y': '-10px', animationDelay: '0.1s' } as React.CSSProperties}></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-primary rounded-full animate-shoot" style={{ '--tw-translate-x': '12px', '--tw-translate-y': '12px', animationDelay: '0.05s' } as React.CSSProperties}></div>
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-shoot" style={{ '--tw-translate-x': '-12px', '--tw-translate-y': '15px', animationDelay: '0.15s' } as React.CSSProperties}></div>
                <div className="absolute top-[-5px] left-1/2 w-1 h-3 bg-white rounded-full animate-shoot" style={{ '--tw-translate-x': '0px', '--tw-translate-y': '-20px', animationDelay: '0.2s' } as React.CSSProperties}></div>
              </>
            )}

            <span className={`font-display font-bold text-lg sm:text-xl tracking-tight transition-colors duration-300 ${isHovered ? 'text-primary' : 'text-dark dark:text-white'}`}>
              لومينا
            </span>
         </div>
      </div>
    </header>
  );
};
