
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { AppState, ToolMode } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, enhanceImageWithGemini } from './services/geminiService';
import { Share2, Wand2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft } from 'lucide-react';

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

  const handleImageSelect = async (displayBase64: string, apiBase64: string, mode: ToolMode) => {
    // عرض الصورة ذات الجودة الجيدة للمستخدم
    setOriginalImage(displayBase64);
    setState(prev => ({ ...prev, error: null, toolMode: mode }));
    
    if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: 'smooth' });

    if (mode === 'enhance') {
      // عرض الصورة الجيدة أثناء التحميل
      setState(prev => ({ ...prev, currentStep: 'enhancing', image: displayBase64 }));
      setLoading(true);
      try {
        // إرسال الصورة المضغوطة جداً للـ API
        const enhancedBase64 = await enhanceImageWithGemini(apiBase64);
        setState(prev => ({ ...prev, currentStep: 'results', image: enhancedBase64 }));
      } catch (error: any) {
        setState(prev => ({ ...prev, currentStep: 'results', error: error.message }));
      } finally {
        setLoading(false);
      }
    } else {
      setState(prev => ({ ...prev, currentStep: 'analyzing', image: displayBase64 }));
      setLoading(true);
      try {
        // إرسال الصورة المضغوطة للتحليل
        const analysis = await analyzeImageWithGemini(apiBase64);
        setState(prev => ({ ...prev, currentStep: 'results', analysis: analysis }));
        setCurrentDescription(analysis.prompt);
      } catch (error: any) {
        setState(prev => ({ ...prev, currentStep: 'results', error: error.message }));
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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors duration-300 font-sans">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} highlightSupport={state.currentStep === 'results'} />
      
      <main className="container mx-auto px-4 py-6 md:py-10">
        {state.currentStep === 'upload' && <Hero onImageSelect={handleImageSelect} />}

        {state.currentStep !== 'upload' && (
          <div className="max-w-[1600px] mx-auto">
            {state.error ? (
              <div className="max-w-xl mx-auto py-20 text-center space-y-6 bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">عذراً، تعذر إكمال الطلب</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed px-4">
                  {state.error === "API_KEY_MISSING" ? "خطأ في إعدادات API Key بموقع Vercel." : state.error}
                </p>
                <button 
                  onClick={handleReset} 
                  className="w-full max-w-xs mx-auto py-4 bg-primary text-white rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all"
                >
                  العودة والمحاولة مرة أخرى
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-[1.5rem] shadow-lg ${
                      state.toolMode === 'enhance' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : 'bg-blue-100 dark:bg-blue-900/40 text-primary'
                    }`}>
                      {state.toolMode === 'enhance' ? <Wand2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {state.toolMode === 'enhance' ? 'تحسين لومينا' : 'تحليل لومينا'}
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
                  
                  <button onClick={handleReset} className="px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-sm border border-gray-100 dark:border-gray-600 flex items-center gap-3 shadow-md hover:scale-105 active:scale-95 transition-all">
                    <ArrowLeft className="w-5 h-5" /> العودة للبداية
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10">
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
                          className="flex items-center justify-center gap-4 bg-primary text-white py-6 rounded-[2rem] font-bold shadow-2xl hover:brightness-110 transition-all"
                        >
                          <Download className="w-6 h-6" /> تحميل الصورة
                        </a>
                        <button 
                          onClick={() => navigator.share && state.image && navigator.share({ title: 'نتائج لومينا', text: 'صورة معالجة بالذكاء الاصطناعي', url: window.location.href })}
                          className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-6 rounded-[2rem] font-bold shadow-xl border border-gray-100 transition-all"
                        >
                          <Share2 className="w-6 h-6" /> مشاركة
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    {state.toolMode === 'analyze' && state.analysis && (
                      <div className="bg-subtle-pattern dark:bg-gray-800/50 rounded-[3rem] p-8 shadow-2xl border border-gray-100">
                        <AnalysisPanel 
                          analysis={state.analysis} 
                          currentDescription={currentDescription}
                          loading={loading}
                          isRefining={isRefining}
                          onRefineDescription={handleRefineDescription}
                        />
                      </div>
                    )}
                    
                    {state.toolMode === 'enhance' && state.currentStep === 'results' && !state.error && (
                      <div className="bg-gradient-to-br from-primary via-blue-700 to-indigo-900 p-12 rounded-[3rem] text-white shadow-2xl border border-white/10">
                          <h3 className="text-3xl font-extrabold mb-6">اكتمل التحسين</h3>
                          <p className="text-lg text-white/80 leading-relaxed font-medium">
                               تمت معالجة الصورة بنجاح. تم تحسين تفاصيل الإضاءة والحدة بذكاء لتناسب ذوقك.
                          </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {state.toolMode === 'analyze' && state.currentStep === 'results' && !state.error && <ChatWidget imageAnalysis={state.analysis} />}
    </div>
  );
};

export default App;
