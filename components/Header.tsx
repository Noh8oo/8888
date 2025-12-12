import React, { useState } from 'react';
import { Heart, Zap, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <header className="w-full h-20 flex items-center justify-between px-6 md:px-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 transition-colors duration-300">
      {/* Support / Donate Button */}
      <a 
        href="https://ko-fi.com/noh8o"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50 transition-all duration-300 group shadow-sm hover:shadow-md"
        title="ادعم تطوير الموقع"
      >
        <Heart className="w-5 h-5 group-hover:fill-current group-hover:scale-110 transition-transform duration-300" />
        <span className="font-bold text-sm hidden sm:block">ادعمنا</span>
      </a>
      
      <div className="flex items-center gap-4">
         <button 
           onClick={toggleDarkMode} 
           className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
           title={isDarkMode ? "الوضع الفاتح" : "الوضع الداكن"}
         >
           {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
         </button>
         
         <div 
           className="group relative flex items-center gap-2 cursor-pointer"
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}
         >
            {/* Logo Container */}
            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-lg transition-all duration-300 z-10 
              ${isHovered ? 'bg-primary shadow-primary/60 scale-110' : 'bg-primary shadow-primary/30'}
            `}>
              <Zap 
                className={`w-5 h-5 text-white transition-all duration-100 ${isHovered ? 'animate-shiver' : ''}`} 
                fill="currentColor" 
              />
              
              {/* Electric Glow behind */}
              <div className={`absolute inset-0 bg-primary blur-md rounded-lg transition-opacity duration-300 ${isHovered ? 'opacity-70' : 'opacity-0'}`}></div>
            </div>

            {/* Particles / Sparks */}
            {isHovered && (
              <>
                {/* Top Right */}
                <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-400 rounded-full animate-shoot" style={{ '--tw-translate-x': '15px', '--tw-translate-y': '-15px' } as React.CSSProperties}></div>
                {/* Top Left */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-blue-300 rounded-full animate-shoot" style={{ '--tw-translate-x': '-15px', '--tw-translate-y': '-10px', animationDelay: '0.1s' } as React.CSSProperties}></div>
                {/* Bottom Right */}
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-primary rounded-full animate-shoot" style={{ '--tw-translate-x': '12px', '--tw-translate-y': '12px', animationDelay: '0.05s' } as React.CSSProperties}></div>
                {/* Bottom Left */}
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-shoot" style={{ '--tw-translate-x': '-12px', '--tw-translate-y': '15px', animationDelay: '0.15s' } as React.CSSProperties}></div>
                {/* Top Center */}
                <div className="absolute top-[-5px] left-1/2 w-1 h-3 bg-white rounded-full animate-shoot" style={{ '--tw-translate-x': '0px', '--tw-translate-y': '-20px', animationDelay: '0.2s' } as React.CSSProperties}></div>
              </>
            )}

            <span className={`font-display font-bold text-xl tracking-tight transition-colors duration-300 ${isHovered ? 'text-primary' : 'text-dark dark:text-white'}`}>
              لومينا
            </span>
         </div>
      </div>
    </header>
  );
};