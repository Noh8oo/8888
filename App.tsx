
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { ArtisticGallery } from './components/ArtisticGallery';
import { AppState, ToolMode, RemixStyle } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, remixImageWithGemini } from './services/geminiService';
import { Share2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft, Film, Sun, Zap, Monitor, Palette } from 'lucide-react';

const TOOLS: RemixStyle[] = [
  { id: 'auto', name: 'تحسين تلقائي', icon: <Sparkles className="w-6 h-6" />, color: 'bg-blue-500', prompt: 'Auto enhance: Balanced brightness, contrast, natural saturation.' },
  { id: 'cine', name: 'سينمائي', icon: <Film className="w-6 h-6" />, color: 'bg-teal-600', prompt: 'Cinematic: Teal/Orange, high contrast, moody.' },
  { id: 'hdr', name: 'HDR', icon: <Zap className="w-6 h-6" />, color: 'bg-purple-500', prompt: 'HDR: High saturation, sharp details, vivid.' },
  { id: 'warm', name: 'دافئ', icon: <Sun className="w-6 h-6" />, color: 'bg-orange-500', prompt: 'Warm: Golden hour, sunny, orange tint.' },
  { id: 'cool', name: 'بارد', icon: <Monitor className="w-6 h-6" />, color: 'bg-indigo-500', prompt: 'Cool: Blue tint, modern, clean.' },
  { id: 'bw', name: 'أبيض وأسود', icon: <Palette className="w-6 h-6" />, color: 'bg-gray-600', prompt: 'B&W: High contrast noir style.' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { error: string | null }>({ currentStep: 'upload', toolMode: null, image: null, analysis: null, error: null });
  const [images, setImages] = useState({ display: '', api: '' });
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => document.documentElement.classList.toggle('dark', darkMode), [darkMode]);

  const handleSelect = async (display: string, api: string, mode: ToolMode) => {
    setImages({ display, api });
    if (mode === 'remix') {
      setState({ ...state, currentStep: 'style-selection', toolMode: mode, image: display, error: null });
    } else {
      setState({ ...state, currentStep: 'analyzing', toolMode: mode, image: display, error: null });
      setLoading(true);
      try {
        const res = await analyzeImageWithGemini(api);
        setState(prev => ({ ...prev, currentStep: 'results', analysis: res }));
        setDesc(res.prompt);
      } catch (e: any) {
        setState(prev => ({ ...prev, currentStep: 'results', error: e.message || "فشل التحليل" }));
      } finally { setLoading(false); }
    }
  };

  const handleStyle = async (style: RemixStyle) => {
    setState(prev => ({ ...prev, currentStep: 'processing', error: null }));
    setLoading(true);
    try {
      // Use display image (high res) for canvas editing
      const res = await remixImageWithGemini(images.display, style.prompt);
      setState(prev => ({ ...prev, currentStep: 'results', image: res }));
    } catch (e: any) {
      setState(prev => ({ ...prev, currentStep: 'results', error: "فشل التحسين" }));
    } finally { setLoading(false); }
  };

  const handleRefine = async (instr: string) => {
    const res = await refineDescriptionWithGemini(desc, instr);
    setDesc(res);
  };

  const reset = () => setState({ currentStep: 'upload', toolMode: null, image: null, analysis: null, error: null });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 font-sans transition-colors">
      <Header isDarkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} highlightSupport={state.currentStep === 'results'} />
      
      <main className="container mx-auto px-4 py-8">
        {state.currentStep === 'upload' ? (
          <Hero onImageSelect={handleSelect} />
        ) : (
          <div className="max-w-[1600px] mx-auto animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200"><ArrowLeft size={20}/> عودة</button>
                {loading && <div className="flex items-center gap-2 text-primary animate-pulse"><RefreshCw className="animate-spin"/> <span>جاري المعالجة...</span></div>}
             </div>

             {state.error ? (
               <div className="text-center py-20 bg-red-50 dark:bg-red-900/20 rounded-3xl">
                 <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                 <h3 className="text-xl font-bold text-red-600 mb-2">حدث خطأ</h3>
                 <p>{state.error}</p>
                 <button onClick={reset} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl">حاول مجدداً</button>
               </div>
             ) : (
               <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                 <div className="space-y-6">
                   <ImageViewer imageSrc={state.image || ''} originalSrc={images.display} isEnhancing={state.currentStep === 'processing'} />
                   {state.currentStep === 'results' && (
                     <div className="flex gap-4">
                       <a href={state.image || ''} download="lumina.jpg" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:brightness-110"><Download size={20}/> حفظ</a>
                       <button onClick={() => navigator.share?.({ title: 'Lumina', url: window.location.href })} className="px-6 border border-gray-200 dark:border-gray-700 rounded-xl"><Share2 size={20}/></button>
                     </div>
                   )}
                 </div>

                 <div className="space-y-6">
                   {state.currentStep === 'style-selection' && (
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl">
                       <h3 className="font-bold mb-4 flex items-center gap-2"><Sparkles className="text-primary"/> اختر أسلوب التحسين</h3>
                       <ArtisticGallery styles={TOOLS} onSelect={handleStyle} />
                     </div>
                   )}
                   {state.analysis && (
                     <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-200 dark:border-gray-700">
                       <AnalysisPanel analysis={state.analysis} currentDescription={desc} loading={loading} isRefining={false} onRefineDescription={handleRefine} />
                     </div>
                   )}
                 </div>
               </div>
             )}
          </div>
        )}
      </main>
      {state.analysis && !state.error && <ChatWidget imageAnalysis={state.analysis} />}
    </div>
  );
};

export default App;
