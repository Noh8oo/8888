
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { ArtisticGallery, ArtisticStyle } from './components/ArtisticGallery';
import { AppState, ToolMode } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, enhanceImageWithGemini, transformImageWithGemini } from './services/geminiService';
import { X, Share2, AlertTriangle, Wand2, RefreshCw, Download, Sparkles, Palette, Check, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const [apiKeyError, setApiKeyError] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const key = process.env.API_KEY;
    if (!key) {
      setApiKeyError(true);
    }
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleImageSelect = async (base64: string, mode: ToolMode) => {
    setOriginalImage(base64);
    setState(prev => ({ ...prev, error: null, toolMode: mode }));
    
    if (mode === 'enhance') {
      setState(prev => ({ ...prev, currentStep: 'enhancing', image: base64 }));
      setLoading(true);
      try {
        const enhancedBase64 = await enhanceImageWithGemini(base64);
        setState(prev => ({ ...prev, currentStep: 'results', image: enhancedBase64 }));
      } catch (error) {
        setState(prev => ({ ...prev, currentStep: 'results', error: "تعذر تحسين جودة الصورة. غالباً ما يكون السبب حجم الملف الكبير جداً أو ضعف الاتصال." }));
      } finally {
        setLoading(false);
      }
    } else if (mode === 'transform') {
      setState(prev => ({ ...prev, currentStep: 'results', image: base64 }));
    } else {
      setState(prev => ({ ...prev, currentStep: 'analyzing', image: base64 }));
      setLoading(true);
      try {
        const analysis = await analyzeImageWithGemini(base64);
        setState(prev => ({ ...prev, currentStep: 'results', analysis: analysis }));
        setCurrentDescription(analysis.prompt);
      } catch (error) {
        setState(prev => ({ ...prev, currentStep: 'results', error: "حدث خطأ أثناء تحليل الصورة. حاول مع صورة أخرى بحجم أصغر." }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApplyStyle = async (style: ArtisticStyle) => {
    if (!originalImage) return;
    setState(prev => ({ ...prev, currentStep: 'transforming', error: null }));
    setLoading(true);
    try {
      const transformedBase64 = await transformImageWithGemini(originalImage, style.instruction);
      setState(prev => ({ ...prev, currentStep: 'results', image: transformedBase64 }));
    } catch (error) {
      setState(prev => ({ ...prev, currentStep: 'results', error: "تعذر تطبيق النمط الفني حالياً." }));
    } finally {
      setLoading(false);
    }
  };

  // Fix: Implemented handleRefineDescription to process prompt adjustments via Gemini
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
        await navigator.share({ title: 'نتائج لومينا', text: 'تم إنشاء هذه الصورة بواسطة لومينا AI', url: window.location.href });
      }
    } catch (err) {}
  };

  if (apiKeyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 font-sans">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl max-w-md text-center border border-gray-100 dark:border-gray-700">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">API Key Required</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">يرجى ضبط مفتاح Gemini في بيئة العمل ليعمل التطبيق.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors duration-300 font-sans selection:bg-primary/20">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} highlightSupport={state.currentStep === 'results'} />
      
      <main className="container mx-auto px-4 py-4 lg:py-6">
        {state.currentStep === 'upload' && <Hero onImageSelect={handleImageSelect} />}

        {state.currentStep !== 'upload' && (
          <div className="max-w-7xl mx-auto animate-fade-in">
            {/* Nav Header */}
            <div className="flex items-center justify-between gap-4 mb-6 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-md px-5 py-3 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-2xl ${
                  state.toolMode === 'enhance' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                  state.toolMode === 'transform' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                  'bg-blue-100 dark:bg-blue-900/30 text-primary'
                }`}>
                  {state.toolMode === 'enhance' && <Wand2 className="w-5 h-5" />}
                  {state.toolMode === 'transform' && <Palette className="w-5 h-5" />}
                  {state.toolMode === 'analyze' && <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    {state.toolMode === 'enhance' ? 'تحسين جودة الصورة' : state.toolMode === 'transform' ? 'استوديو الإبداع' : 'تحليل لومينا الذكي'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {['analyzing', 'enhancing', 'transforming'].includes(state.currentStep) ? (
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> جاري المعالجة...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold">
                        <Check className="w-3 h-3" /> تم بنجاح
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={handleReset} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-2xl font-bold text-xs hover:bg-gray-200 transition-all flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> العودة
              </button>
            </div>

            {state.error ? (
              <div className="max-w-xl mx-auto py-20 text-center space-y-6 animate-fade-in">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold">حدث خطأ تقني</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">{state.error}</p>
                <button onClick={handleReset} className="bg-primary text-white px-10 py-3.5 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">العودة للبداية</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
                {/* Column 1: Image & Main Actions */}
                <div className="space-y-6">
                  <ImageViewer 
                    imageSrc={state.image || originalImage || ''} 
                    originalSrc={originalImage}
                    isEnhancing={['enhancing', 'transforming'].includes(state.currentStep)}
                  />
                  
                  {state.currentStep === 'results' && !state.error && (
                    <div className="grid grid-cols-2 gap-4">
                      <a 
                        href={state.image || ''} 
                        download="lumina_result.png"
                        className="flex items-center justify-center gap-3 bg-primary text-white py-5 rounded-[1.5rem] font-bold shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all"
                      >
                        <Download className="w-5 h-5" /> حفظ النتيجة
                      </a>
                      <button 
                        onClick={handleShare}
                        className="flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-5 rounded-[1.5rem] font-bold shadow-xl border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
                      >
                        <Share2 className="w-5 h-5" /> مشاركة
                      </button>
                    </div>
                  )}
                </div>

                {/* Column 2: Specific Tool Controls */}
                <div className="space-y-6 h-full">
                  {state.toolMode === 'analyze' && (
                    <div className="bg-subtle-pattern dark:bg-gray-800/50 rounded-[2.5rem] p-6 shadow-xl border border-gray-100 dark:border-gray-700 h-full">
                      <AnalysisPanel 
                        analysis={state.analysis} 
                        currentDescription={currentDescription}
                        loading={loading}
                        isRefining={isRefining}
                        onRefineDescription={handleRefineDescription}
                      />
                    </div>
                  )}
                  
                  {state.toolMode === 'transform' && (
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
                      <ArtisticGallery onSelectStyle={handleApplyStyle} isLoading={loading} />
                    </div>
                  )}
                  
                  {state.toolMode === 'enhance' && (
                    <div className="space-y-6 animate-slide-in">
                      <div className="bg-gradient-to-br from-purple-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                           <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-lg">
                             <Sparkles className="w-6 h-6 text-yellow-300" />
                           </div>
                           <h3 className="text-xl font-bold">اكتمال التحسين!</h3>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed mb-6">
                           تمت استعادة التفاصيل الدقيقة ومعالجة الإضاءة باستخدام ذكاء لومينا. يمكنك الآن الانتقال لتحويل صورتك لعمل فني.
                        </p>
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/10 text-[10px] flex items-center gap-3">
                           <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                           جاهزة للتصدير بجودة احترافية
                        </div>
                      </div>

                      <div 
                         onClick={() => setState(prev => ({ ...prev, toolMode: 'transform' }))}
                         className="p-6 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:border-orange-500 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600">
                             <Palette className="w-6 h-6" />
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-bold">تجربة النمط الفني</p>
                             <p className="text-[10px] text-gray-500 mt-1">حول صورتك المحسنة للوحة فنية</p>
                          </div>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-all" />
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
