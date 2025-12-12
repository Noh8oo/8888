import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

interface HeroProps {
  onImageSelect: (base64: string) => void;
}

const LightningIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    className="w-20 h-20 mx-auto transition-all duration-300 drop-shadow-md hover:drop-shadow-xl hover:scale-110"
  >
    <defs>
      <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" /> 
        <stop offset="50%" stopColor="#FACC15" /> 
        <stop offset="100%" stopColor="#EAB308" /> 
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path 
      d="M55 5 L20 60 L45 60 L35 95 L80 35 L55 35 L65 5 Z" 
      fill="url(#boltGradient)" 
      stroke="#CA8A04" 
      strokeWidth="1.5" 
      strokeLinejoin="round"
      className="group-hover:animate-pulse"
      style={{ filter: 'drop-shadow(0px 4px 6px rgba(234, 179, 8, 0.4))' }}
    />
  </svg>
);

const PaletteIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    className="w-20 h-20 mx-auto transition-transform duration-500 group-hover:rotate-6 drop-shadow-md"
  >
    <defs>
      <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" /> 
        <stop offset="100%" stopColor="#D97706" /> 
      </linearGradient>
      <radialGradient id="paintRed" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="100%" stopColor="#EF4444" />
      </radialGradient>
      <radialGradient id="paintBlue" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#3B82F6" />
      </radialGradient>
      <radialGradient id="paintGreen" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#86EFAC" />
        <stop offset="100%" stopColor="#22C55E" />
      </radialGradient>
      <radialGradient id="paintYellow" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#EAB308" />
      </radialGradient>
    </defs>
    
    <path 
      d="M50 10 C 25 10 5 30 5 55 C 5 80 25 95 50 95 C 65 95 72 88 75 80 C 78 72 85 70 90 70 C 95 70 95 65 95 55 C 95 30 75 10 50 10 Z" 
      fill="url(#woodGradient)" 
      stroke="#B45309"
      strokeWidth="1.5"
    />
    <circle cx="75" cy="80" r="6" fill="currentColor" className="text-white dark:text-gray-800 opacity-60" />
    
    <circle cx="30" cy="35" r="9" fill="url(#paintRed)" className="opacity-60 group-hover:opacity-100 transition-all duration-300 delay-75 group-hover:scale-110 origin-[30px_35px]" />
    <circle cx="55" cy="25" r="9" fill="url(#paintGreen)" className="opacity-60 group-hover:opacity-100 transition-all duration-300 delay-150 group-hover:scale-110 origin-[55px_25px]" />
    <circle cx="80" cy="35" r="9" fill="url(#paintBlue)" className="opacity-60 group-hover:opacity-100 transition-all duration-300 delay-200 group-hover:scale-110 origin-[80px_35px]" />
    <circle cx="25" cy="60" r="9" fill="url(#paintYellow)" className="opacity-60 group-hover:opacity-100 transition-all duration-300 delay-300 group-hover:scale-110 origin-[25px_60px]" />
  </svg>
);

const RobotIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    className="w-20 h-20 mx-auto drop-shadow-md transition-transform duration-300 group-hover:scale-105"
  >
    <defs>
      <linearGradient id="metal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="40%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#EAB308" />
      </radialGradient>
    </defs>
    
    {/* Ears */}
    <rect x="5" y="45" width="10" height="20" rx="3" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
    <rect x="85" y="45" width="10" height="20" rx="3" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
    
    {/* Head */}
    <rect x="15" y="25" width="70" height="60" rx="12" fill="url(#metal)" stroke="#64748B" strokeWidth="1.5" />
    
    {/* Antenna */}
    <line x1="50" y1="25" x2="50" y2="10" stroke="#475569" strokeWidth="3" />
    <circle cx="50" cy="8" r="6" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
    
    {/* Screen Area */}
    <rect x="25" y="40" width="50" height="28" rx="6" fill="#1E293B" className="opacity-90" />
    
    {/* Eyes */}
    <circle cx="38" cy="54" r="6" fill="url(#eyeGlow)" className="group-hover:animate-blink origin-[38px_54px]" />
    <circle cx="62" cy="54" r="6" fill="url(#eyeGlow)" className="group-hover:animate-blink origin-[62px_54px]" style={{ animationDelay: '0.1s' }} />
    
    {/* Mouth */}
    <path d="M 40 72 Q 50 78 60 72" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

export const Hero: React.FC<HeroProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageSelect(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const features = [
    { 
      id: 'analysis',
      icon: <LightningIcon />, 
      title: "تحليل سريع", 
      desc: "استخرج الألوان والأنماط والتخطيط في ثوانٍ." 
    },
    { 
      id: 'edit',
      icon: <PaletteIcon />, 
      title: "تعديل ذكي", 
      desc: "عدّل صورك باستخدام أوامر نصية بسيطة." 
    },
    { 
      id: 'chat',
      icon: <RobotIcon />, 
      title: "محادثة ذكية", 
      desc: "اسأل مساعد الذكاء الاصطناعي عن تصميمك." 
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10 space-y-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-dark dark:text-white leading-tight transition-colors duration-300">
          واجهة تحليل وتصميم <br className="hidden md:block" /> الصور بالذكاء الاصطناعي
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg transition-colors duration-300">
          واجهة نظيفة ومتخصصة لتحليل الصور، استخراج الأنماط، والتعديل الفوري باستخدام نماذج Gemini.
        </p>
      </div>

      <div 
        className={`
          relative w-full h-[320px] rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
          ${isDragging 
            ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-[1.02]' 
            : 'border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileInput}
        />
        
        <div className={`p-6 rounded-full bg-gray-50 dark:bg-gray-800 mb-6 group-hover:scale-110 transition-transform duration-300 ${isDragging ? 'bg-white dark:bg-gray-700' : ''}`}>
           <UploadCloud className={`w-12 h-12 ${isDragging ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`} />
        </div>
        
        <h3 className="text-xl font-bold text-dark dark:text-white mb-2 transition-colors duration-300">ارفع صورتك هنا</h3>
        <p className="text-gray-400 text-sm">اسحب وأفلت الملف أو انقر للتصفح</p>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl pointer-events-none">
           <div className={`absolute top-10 left-10 text-gray-200 dark:text-gray-700 transition-transform duration-700 ${isDragging ? 'translate-x-4' : ''}`}>
             <ImageIcon className="w-16 h-16 opacity-20" />
           </div>
           <div className={`absolute bottom-10 right-10 text-gray-200 dark:text-gray-700 transition-transform duration-700 ${isDragging ? '-translate-y-4' : ''}`}>
             <ImageIcon className="w-24 h-24 opacity-20" />
           </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
         {features.map((item, i) => (
           <div key={i} className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
             <div className="mb-6 flex justify-center h-20 items-center">
                {item.icon}
             </div>
             <h4 className="font-bold text-lg text-dark dark:text-white mb-2 transition-colors duration-300">{item.title}</h4>
             <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300 leading-relaxed">{item.desc}</p>
           </div>
         ))}
      </div>
    </div>
  );
};