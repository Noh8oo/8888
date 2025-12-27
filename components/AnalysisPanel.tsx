
import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { Copy, Check, Palette, Layout, Camera, Eye, Sparkles, PenTool, ArrowLeft, Film, Sun, Minimize, Zap, Moon, Aperture, Wand2, ChevronDown, ChevronUp, Box, RefreshCw, Feather, Monitor,  Hexagon, CloudRain, Layers, Ghost, Maximize2, Minimize2, Quote } from 'lucide-react';
import { Button } from './Button';

interface AnalysisPanelProps {
  analysis: ImageAnalysis | null;
  currentDescription: string;
  loading: boolean;
  isRefining: boolean;
  onRefineDescription: (instruction: string) => void;
}

// Master list of all available filters
const ALL_SMART_FILTERS = [
  { id: 'cinematic', label: 'سينمائي', icon: Film, prompt: 'أعد صياغة الوصف ليعكس طابعاً سينمائياً درامياً، مع التركيز على الإضاءة الخافتة، عمق المجال، والألوان السينمائية.' },
  { id: 'vibrant', label: 'ألوان حيوية', icon: Sun, prompt: 'اجعل الوصف يبرز الألوان الحيوية والمشبعة، مع إضاءة ساطعة وطاقة عالية في المشهد.' },
  { id: 'minimalist', label: 'تبسيط', icon: Minimize, prompt: 'بسط الوصف ليعكس أسلوباً (Minimalist) نظيفاً، مع إزالة التفاصيل المزدحمة والتركيز على العناصر الأساسية فقط.' },
  { id: 'cyberpunk', label: 'سايبر بانك', icon: Zap, prompt: 'حول الوصف إلى نمط السايبر بانك (Cyberpunk)، مع أضواء النيون، التكنولوجيا المتقدمة، وأجواء ليلية ممطرة.' },
  { id: 'bw', label: 'أبيض وأسود', icon: Moon, prompt: 'حول الوصف ليناسب صورة فنية بالأبيض والأسود، مع التركيز على التباين العالي والظلال والضوء.' },
  { id: 'studio', label: 'استوديو', icon: Aperture, prompt: 'اجعل الوصف يصف لقطة استوديو احترافية، مع إضاءة ناعمة مدروسة، خلفية خالية من التشويش، ووضوح عالي.' },
  { id: 'watercolor', label: 'ألوان مائية', icon: Feather, prompt: 'حول النمط إلى رسم بالألوان المائية (Watercolor)، مع ضربات فرشاة ناعمة، ألوان متداخلة، وطابع فني حالم.' },
  { id: '3d-render', label: 'تصميم 3D', icon: Box, prompt: 'اجعل الوصف يصف مشهداً ثلاثي الأبعاد (3D Render) عالي الجودة بأسلوب Pixar أو Unreal Engine، مع إضاءة واقعية وخامات ناعمة.' },
  { id: 'anime', label: 'أنمي', icon: Ghost, prompt: 'حول الوصف إلى نمط الأنمي الياباني، مع خطوط محددة، تظليل مميز، وملامح تعبيرية.' },
  { id: 'vintage', label: 'كلاسيكي قديم', icon: Layers, prompt: 'أضف طابعاً كلاسيكياً قديماً (Vintage/Retro) من الثمانينات أو التسعينات، مع تأثيرات التحبب (Grain) وألوان باهتة قليلاً.' },
  { id: 'surreal', label: 'سريالي', icon: CloudRain, prompt: 'أضف لمسة سريالية (Surrealism) حالمة وغريبة، حيث تندمج العناصر بطرق غير منطقية ومثيرة للخيال.' },
  { id: 'pixel', label: 'بكسل آرت', icon: Hexagon, prompt: 'حول الصورة إلى فن البكسل (Pixel Art) بأسلوب ألعاب الفيديو القديمة، مع تفاصيل رقمية واضحة.' },
  { id: 'digital', label: 'فن رقمي', icon: Monitor, prompt: 'حول الوصف إلى لوحة فن رقمي (Digital Art) حديثة، مع تفاصيل دقيقة، ألوان متوهجة، وتكوين خيالي.' },
];

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  analysis, 
  currentDescription, 
  loading, 
  isRefining, 
  onRefineDescription 
}) => {
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // State for displayed filters
  const [displayedFilters, setDisplayedFilters] = useState(ALL_SMART_FILTERS.slice(0, 6));
  const [isShuffling, setIsShuffling] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const copyPrompt = () => {
    if (currentDescription) {
      navigator.clipboard.writeText(currentDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefineSubmit = () => {
    if (instruction.trim()) {
      onRefineDescription(instruction);
      setInstruction('');
    }
  };

  const handleShuffleFilters = () => {
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 500);
    const shuffled = [...ALL_SMART_FILTERS].sort(() => 0.5 - Math.random());
    setDisplayedFilters(shuffled.slice(0, 6));
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-slide-in">
        {/* Skeleton UI remains unchanged */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shadow-sm border border-transparent"></div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
             <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
             <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm h-24 animate-pulse"></div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm h-24 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      {/* Colors Section */}
      <div className="space-y-3">
        <h4 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2">
          <Palette className="w-4 h-4" /> لوحة الألوان
        </h4>
        <div className="flex flex-wrap gap-3">
          {analysis.colors.map((color, idx) => (
            <div key={idx} className="group relative">
              <div 
                className="w-12 h-12 rounded-full shadow-sm border border-black/5 dark:border-white/10 cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-md hover:ring-2 hover:ring-white dark:hover:ring-gray-300 hover:ring-offset-2 dark:hover:ring-offset-gray-800"
                style={{ backgroundColor: color }}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono bg-white dark:bg-gray-900 dark:text-gray-300 px-1 rounded shadow-sm whitespace-nowrap z-10 pointer-events-none">
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Objects Section */}
      {analysis.objects && analysis.objects.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2">
            <Box className="w-4 h-4" /> العناصر المكتشفة
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.objects.map((obj, idx) => (
              <span 
                key={idx} 
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm transition-all hover:border-primary/50 hover:text-primary dark:hover:text-primary cursor-default hover:shadow-sm"
              >
                {obj}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Style Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-md hover:-translate-y-1 group">
          <div className="flex items-center gap-3 mb-3 text-primary">
            <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
              <Eye className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">النمط الفني</span>
          </div>
          <p className="font-bold text-lg text-dark dark:text-white leading-tight">{analysis.style}</p>
        </div>
        
        {/* Layout Card - ENHANCED */}
        <div 
          className={`relative p-5 rounded-2xl border transition-all duration-500 ease-in-out cursor-pointer group 
            ${expandedSection === 'layout' 
              ? 'col-span-full bg-blue-50/50 dark:bg-blue-900/10 border-primary/30 shadow-lg ring-1 ring-primary/20' 
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-md hover:-translate-y-1'
            }`}
          onClick={() => toggleSection('layout')}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 mb-3 text-primary">
              <div className={`p-2 rounded-lg transition-colors duration-300 ${expandedSection === 'layout' ? 'bg-primary text-white' : 'bg-primary/5 group-hover:bg-primary/10'}`}>
                <Layout className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">التكوين والتخطيط</span>
            </div>
            {analysis.layoutDetail && (
              <button className="text-gray-400 hover:text-primary transition-colors">
                 {expandedSection === 'layout' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>

          <p className={`font-bold text-lg text-dark dark:text-white leading-tight transition-all ${expandedSection === 'layout' ? 'text-primary dark:text-primary mb-4' : ''}`}>
            {analysis.layout}
          </p>
          
          {/* Animated Detail Section */}
          <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${expandedSection === 'layout' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              {analysis.layoutDetail && (
                <div className="relative mt-2 p-5 bg-white dark:bg-gray-900 rounded-xl border-l-4 border-primary text-sm text-gray-600 dark:text-gray-300 leading-relaxed shadow-sm">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-gray-100 dark:text-gray-800 transform -scale-x-100" />
                  <div className="relative z-10">
                    <h5 className="font-bold text-dark dark:text-white mb-2 text-xs uppercase opacity-70">تفاصيل تقنية</h5>
                    {analysis.layoutDetail}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-md hover:-translate-y-1 group col-span-full md:col-span-2">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-3 text-primary">
              <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">زاوية الرؤية</span>
            </div>
            {analysis.viewDetail && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleSection('view'); }}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-primary dark:hover:text-primary transition-colors bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-full"
              >
                 <span>{expandedSection === 'view' ? 'إخفاء' : 'المزيد'}</span>
                 {expandedSection === 'view' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          <p className="font-bold text-lg text-dark dark:text-white leading-tight">{analysis.view}</p>
          
          {analysis.viewDetail && expandedSection === 'view' && (
             <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 leading-relaxed animate-fade-in bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-lg">
                {analysis.viewDetail}
             </div>
          )}
        </div>
      </div>

      {/* Prompt Section */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
           <h4 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2">
             <PenTool className="w-4 h-4" /> الوصف المستخرج (البروميت)
           </h4>
           <button 
            onClick={copyPrompt}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied 
                ? 'bg-success text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="نسخ النص"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
          </button>
        </div>
        
        <div className="relative group">
          <div className={`w-full min-h-[140px] p-4 bg-gray-900 dark:bg-black text-gray-300 rounded-xl font-mono text-sm leading-relaxed shadow-inner transition-opacity ${isRefining ? 'opacity-50' : 'opacity-100'}`}>
             {currentDescription}
          </div>
          {isRefining && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Smart Filters Grid */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2">
              <Wand2 className="w-4 h-4" /> فلاتر ذكية (Smart Filters)
            </h4>
            <button 
              onClick={handleShuffleFilters}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary transition-all duration-300 focus:outline-none"
              title="عرض فلاتر عشوائية"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {displayedFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onRefineDescription(filter.prompt)}
                disabled={isRefining}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-0.5 animate-fade-in"
              >
                <filter.icon className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors duration-300" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-white transition-colors">
                  {filter.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Refine / Merge Section */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all duration-300 hover:shadow-md">
          <label className="block text-sm font-bold text-dark dark:text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            دمج وتخصيص الوصف
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="مثال: 'أضف سيارة طائرة'، 'اجعل الألوان داكنة'، 'ترجم للانجليزية'"
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()}
              disabled={isRefining}
            />
            <Button 
              onClick={handleRefineSubmit} 
              loading={isRefining}
              disabled={!instruction.trim() || isRefining}
              className="px-4"
            >
              <ArrowLeft className="w-4 h-4 ml-1" />
              تحديث
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            اكتب تعديلاتك أو إضافاتك ليتم دمجها مع الوصف الأصلي بذكاء.
          </p>
        </div>
      </div>
    </div>
  );
};
