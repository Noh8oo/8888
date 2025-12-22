
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { AppState, ToolMode } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, enhanceImageWithGemini } from './services/geminiService';
import { Share2, Wand2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { error: string | null }>({
    currentStep: 'upload',
    toolMode: null,
    image: null,
    analysis: null,
    error: null,
  });
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleImageSelect = async (base64: string, mode: ToolMode) => {
    setOriginalImage(base64);
    setState(prev => ({ ...prev, error: null, toolMode: mode }));
    
    if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: 'smooth' });

    if (mode === 'enhance') {
      setState(prev => ({ ...prev, currentStep: 'enhancing', image: base64 }));
      setLoading(true);
      try {
        const enhancedBase64 = await enhanceImageWithGemini(base64);
        setState(prev => ({ ...prev, currentStep: 'results', image: enhancedBase64 }));
      } catch (error: any) {
        setState(prev => ({ 
          ...prev, 
          currentStep: 'results', 
          error: "حدث خطأ أثناء تحسين الصورة. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى." 
        }));
      } finally {
        setLoading(false);
      }
    } else {
      setState(prev => ({ ...prev, currentStep: 'analyzing', image: base64 }));
      setLoading(true);
      try {
        const analysis = await analyzeImageWithGemini(base64);
        setState(prev => ({ ...prev, currentStep: 'results', analysis: analysis }));
        setCurrentDescription(analysis.prompt);
      } catch (error: any) {
        setState(prev => ({ 
          ...prev, 
          currentStep: 'results', 
          error: "حدث خطأ أثناء تحليل الصورة. يرجى المحاولة مرة أخرى." 
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefineDescription = async (instruction: string) => {
    setIsRefining(true);
    try {
      const refined = await refineDescriptionWithGemini(currentDescription, instruction);
      setCurrentDescription(refined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleReset = () => {
    setState({ currentStep: 'upload', toolMode: null, image: null, analysis: null, error: null });
    setOriginalImage(null);
    setCurrentDescription('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors duration-300 font-sans selection:bg-primary/20">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} highlightSupport={state.currentStep === 'results'} />
      
      <main className="container mx-auto px-4 py-6 md:py-10">
        {state.currentStep === 'upload' && <Hero onImageSelect={handleImageSelect} />}

        {state.currentStep !== 'upload' && (
          <div className="max-w-[1600px] mx-auto animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
              <div className="flex items-center gap-5 w-full sm:w-auto">
                <div className={`p-4 rounded-[1.5rem] shadow-lg ${
                  state.toolMode === 'enhance' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : 'bg-blue-100 dark:bg-blue-900/40 text-primary'
                }`}>
                  {state.toolMode === 'enhance' ? <Wand2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {state.toolMode === 'enhance' ? 'تحسين لومينا الذكي' : 'تحليل لومينا الذكي'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {['analyzing', 'enhancing'].includes(state.currentStep) ? (
                      <span className="flex items-center gap-2 text-xs text-gray-500 font-bold animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> جاري المعالجة...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                        <Check className="w-3 h-3" /> تم بنجاح
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button 
                  onClick={handleReset} 
                  className="px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all border border-gray-100 dark:border-gray-600 flex items-center justify-center gap-3 shadow-md active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" /> العودة للبداية
                </button>
              </div>
            </div>

            {state.error ? (
              <div className="max-w-xl mx-auto py-24 text-center space-y-8 animate-fade-in bg-red-50/50 dark:bg-red-900/10 rounded-[3rem] p-10 border border-red-100/50 dark:border-red-900/20">
                <div className="w-28 h-28 bg-red-100 dark:bg-red-900/30 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                  <AlertCircle className="w-14 h-14 text-red-500" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold">عذراً، حدث خطأ</h3>
                  <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">{state.error}</p>
                </div>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                   <button onClick={handleReset} className="bg-primary text-white px-12 py-5 rounded-[1.5rem] font-bold shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">إعادة المحاولة</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1.3fr_0.7fr] gap-10 items-start">
                <div className="space-y-8">
                  <ImageViewer 
                    imageSrc={state.image || originalImage || ''} 
                    originalSrc={originalImage}
                    isEnhancing={['enhancing'].includes(state.currentStep)}
                  />
                  
                  {state.currentStep === 'results' && !state.error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <a 
                        href={state.image || ''} 
                        download="lumina_result.png"
                        className="flex items-center justify-center gap-4 bg-primary text-white py-6 rounded-[2rem] font-bold shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all group"
                      >
                        <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" /> حفظ الصورة
                      </a>
                      <button 
                        onClick={() => {
                          if (navigator.share && state.image) {
                            navigator.share({ title: 'نتائج لومينا', text: 'صورة معالجة بالذكاء الاصطناعي', url: window.location.href });
                          }
                        }}
                        className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-6 rounded-[2rem] font-bold shadow-xl border border-gray-100 dark:border-gray-700 active:scale-95 transition-all hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <Share2 className="w-6 h-6" /> مشاركة
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-8 sticky top-28">
                  {state.toolMode === 'analyze' && (
                    <div className="bg-subtle-pattern dark:bg-gray-800/50 rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-700 h-full backdrop-blur-md">
                      <AnalysisPanel 
                        analysis={state.analysis} 
                        currentDescription={currentDescription}
                        loading={loading}
                        isRefining={isRefining}
                        onRefineDescription={handleRefineDescription}
                      />
                    </div>
                  )}
                  
                  {state.toolMode === 'enhance' && (
                    <div className="space-y-6 animate-slide-in">
                      <div className="bg-gradient-to-br from-primary via-blue-700 to-indigo-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-center min-h-[450px] border border-white/10">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <div className="flex items-center gap-6 mb-8 relative z-10">
                           <div className="p-5 bg-white/10 rounded-[2.2rem] backdrop-blur-xl shadow-2xl border border-white/20">
                             <Zap className="w-10 h-10 text-yellow-400 fill-current" />
                           </div>
                           <h3 className="text-3xl font-extrabold">اكتمل التحسين</h3>
                        </div>
                        <div className="space-y-6 relative z-10">
                          <p className="text-lg text-white/80 leading-relaxed font-medium">
                             تمت معالجة الصورة باستخدام الذكاء الاصطناعي لتحسين الألوان والحدة. يمكنك الآن مقارنة النتيجة بالصورة الأصلية.
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                               <span className="block text-blue-300 text-xs font-bold mb-1 uppercase tracking-widest">الحالة</span>
                               <span className="text-xl font-bold">محسنة</span>
                             </div>
                             <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                               <span className="block text-blue-300 text-xs font-bold mb-1 uppercase tracking-widest">المحرك</span>
                               <span className="text-xl font-bold">Lumina Flash</span>
                             </div>
                          </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between relative z-10 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                           <span>Powered by Gemini Flash</span>
                           <Check className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {state.toolMode === 'analyze' && state.currentStep === 'results' && !state.error && <ChatWidget imageAnalysis={state.analysis} />}
    </div>
  );
};

export default App;
