
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { AppState, ToolMode } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, enhanceImageWithGemini } from './services/geminiService';
import { Share2, Wand2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft, Key, Settings, ExternalLink } from 'lucide-react';

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
        setState(prev => ({ ...prev, currentStep: 'results', error: error.message }));
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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors duration-300 font-sans selection:bg-primary/20">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} highlightSupport={state.currentStep === 'results'} />
      
      <main className="container mx-auto px-4 py-6 md:py-10">
        {state.currentStep === 'upload' && <Hero onImageSelect={handleImageSelect} />}

        {state.currentStep !== 'upload' && (
          <div className="max-w-[1600px] mx-auto animate-fade-in">
            {state.error ? (
              <div className="max-w-3xl mx-auto py-12 text-center space-y-8 bg-white dark:bg-gray-800 rounded-[3rem] p-8 md:p-12 border border-red-100 dark:border-red-900/30 shadow-2xl">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-dark dark:text-white">تحتاج لربط المفتاح في Vercel</h3>
                  <p className="text-gray-500 dark:text-gray-400">لقد اكتشفنا أن الموقع لا يملك صلاحية الوصول للمفتاح حالياً.</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] p-8 text-right border border-blue-100 dark:border-blue-800/50 space-y-6">
                  <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 border-b border-blue-100 dark:border-blue-800 pb-4">
                    <Settings className="w-6 h-6" />
                    <h4 className="font-bold text-lg">خطوات التفعيل السريع لـ Vercel:</h4>
                  </div>
                  
                  <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                    <li className="flex gap-3">
                      <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                      <p>ادخل لصفحة مشروعك في <b>Vercel</b> وافتح تبويب <b>Settings</b>.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                      <p>اختر <b>Environment Variables</b> وأضف اسماً جديداً: <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-red-500 font-bold">API_KEY</code>.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                      <p>ضع المفتاح الذي يبدأ بـ <span className="text-green-600 font-bold">AIza...</span> في خانة القيمة واضغط <b>Save</b>.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                      <p>اذهب لتبويب <b>Deployments</b> واضغط <b>Redeploy</b> لآخر نسخة ليعمل المفتاح.</p>
                    </li>
                  </ol>

                  <div className="pt-4 flex flex-wrap gap-4">
                    <a href="https://vercel.com/dashboard" target="_blank" className="bg-dark text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-all">
                      <ExternalLink className="w-4 h-4" /> اذهب لـ Vercel Dashboard
                    </a>
                    <a href="https://aistudio.google.com/" target="_blank" className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/80 transition-all">
                      <Key className="w-4 h-4" /> صفحة مفاتيح Google
                    </a>
                  </div>
                </div>

                <button onClick={handleReset} className="px-10 py-4 bg-gray-100 dark:bg-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all">العودة للرئيسية</button>
              </div>
            ) : (
              <>
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
                    
                    {state.currentStep === 'results' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <a 
                          href={state.image || ''} 
                          download="lumina_result.png"
                          className="flex items-center justify-center gap-4 bg-primary text-white py-6 rounded-[2rem] font-bold shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all"
                        >
                          <Download className="w-6 h-6" /> حفظ الصورة
                        </a>
                        <button 
                          onClick={() => navigator.share && state.image && navigator.share({ title: 'نتائج لومينا', text: 'صورة معالجة بالذكاء الاصطناعي', url: window.location.href })}
                          className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-6 rounded-[2rem] font-bold shadow-xl border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
                        >
                          <Share2 className="w-6 h-6" /> مشاركة
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    {state.toolMode === 'analyze' && (
                      <div className="bg-subtle-pattern dark:bg-gray-800/50 rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-700">
                        <AnalysisPanel 
                          analysis={state.analysis} 
                          currentDescription={currentDescription}
                          loading={loading}
                          isRefining={isRefining}
                          onRefineDescription={handleRefineDescription}
                        />
                      </div>
                    )}
                    
                    {state.toolMode === 'enhance' && state.currentStep === 'results' && (
                      <div className="bg-gradient-to-br from-primary via-blue-700 to-indigo-900 p-12 rounded-[3rem] text-white shadow-2xl border border-white/10">
                          <h3 className="text-3xl font-extrabold mb-6">اكتمل التحسين</h3>
                          <p className="text-lg text-white/80 leading-relaxed font-medium">
                               تمت معالجة الصورة بنجاح. تم تحسين تفاصيل الإضاءة والحدة بذكاء.
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
