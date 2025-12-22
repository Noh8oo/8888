
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { AppState, ToolMode } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, enhanceImageWithGemini } from './services/geminiService';
import { Share2, AlertTriangle, Wand2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft } from 'lucide-react';

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
    
    // Smooth scroll to top on mobile when starting
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
          error: "تعذر تحسين جودة الصورة. تأكد من أن مفتاح الـ API صحيح وأن الصورة ليست كبيرة جداً." 
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
          error: "حدث خطأ أثناء تحليل الصورة. يرجى التأكد من اتصال الإنترنت وصلاحية المفتاح." 
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
      console.error("Refine error:", error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleReset = () => {
    setState({ currentStep: 'upload', toolMode: null, image: null, analysis: null, error: null });
    setOriginalImage(null);
    setCurrentDescription('');
  };

  const handleShare = async () => {
    if (!state.image) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'نتائج لومينا', text: 'تمت معالجة هذه الصورة بواسطة لومينا AI', url: window.location.href });
      }
    } catch (err) {}
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
                    {state.toolMode === 'enhance' ? 'تحسين جودة الصورة' : 'تحليل لومينا الذكي'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {['analyzing', 'enhancing'].includes(state.currentStep) ? (
                      <span className="flex items-center gap-2 text-xs text-gray-500 font-bold animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> جاري المعالجة بذكاء لومينا...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                        <Check className="w-3 h-3" /> النتائج جاهزة للاستخدام
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleReset} 
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all border border-gray-100 dark:border-gray-600 flex items-center justify-center gap-3 shadow-md active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" /> العودة للبداية
              </button>
            </div>

            {state.error ? (
              <div className="max-w-xl mx-auto py-24 text-center space-y-8 animate-fade-in bg-red-50/50 dark:bg-red-900/10 rounded-[3rem] p-10 border border-red-100/50 dark:border-red-900/20">
                <div className="w-28 h-28 bg-red-100 dark:bg-red-900/30 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                  <AlertCircle className="w-14 h-14 text-red-500" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold">عذراً، حدث خطأ تقني</h3>
                  <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">{state.error}</p>
                </div>
                <button onClick={handleReset} className="bg-primary text-white px-12 py-5 rounded-[1.5rem] font-bold shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">محاولة مرة أخرى</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1.3fr_0.7fr] gap-10 items-start">
                {/* Column 1: Primary Content (The Image) */}
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
                        <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" /> حفظ النتيجة بجودة عالية
                      </a>
                      <button 
                        onClick={handleShare}
                        className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-6 rounded-[2rem] font-bold shadow-xl border border-gray-100 dark:border-gray-700 active:scale-95 transition-all hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <Share2 className="w-6 h-6" /> مشاركة النتيجة
                      </button>
                    </div>
                  )}
                </div>

                {/* Column 2: Tools & Information */}
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
                      <div className="bg-gradient-to-br from-primary via-blue-600 to-purple-700 p-12 rounded-[3rem] text-white shadow-[0_20px_60px_rgba(30,136,229,0.3)] relative overflow-hidden h-full flex flex-col justify-center min-h-[500px]">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-400/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>
                        
                        <div className="flex items-center gap-6 mb-8 relative z-10">
                           <div className="p-5 bg-white/20 rounded-[2rem] backdrop-blur-xl shadow-2xl border border-white/20">
                             <Sparkles className="w-10 h-10 text-yellow-300" />
                           </div>
                           <h3 className="text-3xl font-extrabold font-display">تحفة فنية جديدة!</h3>
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                          <p className="text-lg text-white/90 leading-relaxed font-medium">
                             تمت معالجة الصورة باستخدام ذكاء لومينا المتطور. تم فحص كل بكسل لاستعادة التفاصيل المخفية وتصحيح التباين اللوني بدقة متناهية.
                          </p>
                          
                          <div className="grid grid-cols-1 gap-4 pt-4">
                            <div className="flex items-center gap-4 bg-black/20 p-5 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.6)]"></div>
                              <span className="text-sm font-bold">تمت استعادة التفاصيل الدقيقة والحدة.</span>
                            </div>
                            <div className="flex items-center gap-4 bg-black/20 p-5 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(96,165,250,0.6)]"></div>
                              <span className="text-sm font-bold">معالجة الإضاءة والظلال بشكل طبيعي.</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between relative z-10">
                           <div className="text-xs font-bold text-white/60">مدعوم بـ Lumina Engine v2.5</div>
                           <Check className="w-6 h-6 text-white/80" />
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
