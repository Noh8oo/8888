
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { AppState, ToolMode, RemixStyle } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, remixImageWithGemini } from './services/geminiService';
import { Share2, Wand2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft, Palette, Camera, Ghost, Box, Zap } from 'lucide-react';

const REMIX_STYLES: RemixStyle[] = [
  { id: 'realistic', name: 'تحسين واقعي', icon: '📷', color: 'bg-blue-500', prompt: 'High quality, 4k resolution, hyper realistic, improve lighting and textures, detailed photography' },
  { id: 'cinematic', name: 'سينمائي', icon: '🎬', color: 'bg-red-500', prompt: 'Cinematic lighting, dramatic atmosphere, movie scene, depth of field, 8k' },
  { id: 'anime', name: 'أنمي ياباني', icon: '👻', color: 'bg-pink-500', prompt: 'Japanese anime style, vibrant colors, studio ghibli style, detailed illustration' },
  { id: '3d', name: 'ثلاثي الأبعاد', icon: '🧊', color: 'bg-indigo-500', prompt: '3D render, Pixar style, cute, smooth textures, volumetric lighting, unreal engine 5' },
  { id: 'cyberpunk', name: 'سايبر بانك', icon: '⚡', color: 'bg-yellow-500', prompt: 'Cyberpunk style, neon lights, futuristic city background, night time, rain' },
  { id: 'sketch', name: 'رسم يدوي', icon: '✏️', color: 'bg-gray-500', prompt: 'Pencil sketch, hand drawn, artistic, charcoal, detailed lines' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { error: string | null }>({
    currentStep: 'upload',
    toolMode: null,
    image: null,
    analysis: null,
    error: null,
  });
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [apiImage, setApiImage] = useState<string | null>(null); // Store the compressed image for API
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<RemixStyle | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleImageSelect = async (displayBase64: string, apiBase64: string, mode: ToolMode) => {
    setOriginalImage(displayBase64);
    setApiImage(apiBase64);
    
    if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: 'smooth' });

    if (mode === 'remix') {
      // Go to style selection instead of immediate processing
      setState(prev => ({ ...prev, currentStep: 'style-selection', toolMode: mode, image: displayBase64, error: null }));
    } else {
      setState(prev => ({ ...prev, currentStep: 'analyzing', toolMode: mode, image: displayBase64, error: null }));
      setLoading(true);
      try {
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

  const handleStyleSelect = async (style: RemixStyle) => {
    if (!apiImage) return;
    
    setSelectedStyle(style);
    setState(prev => ({ ...prev, currentStep: 'processing' }));
    setLoading(true);

    try {
      const remixedImage = await remixImageWithGemini(apiImage, style.prompt);
      setState(prev => ({ ...prev, currentStep: 'results', image: remixedImage }));
    } catch (error: any) {
      console.error("Remix Error details:", error);
      setState(prev => ({ ...prev, currentStep: 'results', error: error.message }));
    } finally {
      setLoading(false);
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
    setApiImage(null);
    setCurrentDescription('');
    setSelectedStyle(null);
  };

  const getFriendlyErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes("API_KEY_MISSING")) return "لم يتم العثور على مفتاح API. تأكد من إعدادات Vercel (اسم المتغير VITE_API_KEY).";
    if (errorMsg.includes("400")) return "تعذر معالجة هذه الصورة بالتحديد. يرجى تجربة صورة أخرى أقل تعقيداً.";
    if (errorMsg.includes("403") || errorMsg.includes("location")) return "الخدمة غير متاحة في منطقتك حالياً أو الحساب محظور.";
    if (errorMsg.includes("SAFETY")) return "تم حظر الصورة بواسطة فلاتر الأمان. جرب صورة مختلفة.";
    return errorMsg;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors duration-300 font-sans">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} highlightSupport={state.currentStep === 'results'} />
      
      <main className="container mx-auto px-4 py-6 md:py-10">
        {state.currentStep === 'upload' && <Hero onImageSelect={handleImageSelect} />}

        {state.currentStep !== 'upload' && (
          <div className="max-w-[1600px] mx-auto">
            {state.error ? (
              <div className="max-w-xl mx-auto py-20 text-center space-y-6 bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-700 animate-slide-in">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">عذراً، حدث خطأ</h3>
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-medium">
                    {getFriendlyErrorMessage(state.error)}
                  </p>
                  {state.error.includes("API_KEY") && (
                     <p className="text-xs text-gray-500 mt-2">تلميح: تأكد من إضافة VITE_API_KEY في إعدادات Vercel</p>
                  )}
                </div>
                <button 
                  onClick={handleReset} 
                  className="w-full max-w-xs mx-auto py-4 bg-primary text-white rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  العودة والمحاولة مرة أخرى
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-[1.5rem] shadow-lg ${
                      state.toolMode === 'remix' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : 'bg-blue-100 dark:bg-blue-900/40 text-primary'
                    }`}>
                      {state.toolMode === 'remix' ? <Palette className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {state.toolMode === 'remix' ? 'إستوديو لومينا' : 'تحليل لومينا'}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {['analyzing', 'processing'].includes(state.currentStep) ? (
                          <span className="flex items-center gap-2 text-xs text-gray-500 font-bold animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" /> جاري المعالجة...
                          </span>
                        ) : state.currentStep === 'style-selection' ? (
                          <span className="flex items-center gap-2 text-xs text-purple-500 font-bold px-3 py-1 rounded-full">
                            <Sparkles className="w-3 h-3" /> بانتظار اختيار النمط
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
                      isEnhancing={['processing'].includes(state.currentStep)}
                    />
                    
                    {state.currentStep === 'results' && !state.error && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <a 
                          href={state.image || ''} 
                          download="lumina_remix.png"
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
                    {/* Style Selection Panel */}
                    {state.currentStep === 'style-selection' && (
                      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-700 animate-slide-in">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <Palette className="w-5 h-5 text-purple-500" />
                          اختر نمط التحويل
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {REMIX_STYLES.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => handleStyleSelect(style)}
                              className="group relative p-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-500/30 transition-all duration-300 text-center flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-lg"
                            >
                              <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{style.icon}</span>
                              <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{style.name}</span>
                              <div className={`absolute bottom-0 inset-x-0 h-1 rounded-b-2xl ${style.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-6 text-center">
                          سيقوم الذكاء الاصطناعي بإعادة رسم صورتك بالكامل بناءً على النمط المختار.
                        </p>
                      </div>
                    )}

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
                    
                    {state.toolMode === 'remix' && state.currentStep === 'results' && !state.error && (
                      <div className="bg-gradient-to-br from-purple-600 to-indigo-800 p-12 rounded-[3rem] text-white shadow-2xl border border-white/10">
                          <h3 className="text-3xl font-extrabold mb-6 flex items-center gap-3">
                             <Sparkles className="w-8 h-8 text-yellow-300" />
                             تمت إعادة التخيل!
                          </h3>
                          <p className="text-lg text-white/80 leading-relaxed font-medium mb-4">
                               تم تحويل صورتك بنجاح بنمط <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-lg">{selectedStyle?.name}</span>.
                          </p>
                          <button onClick={handleReset} className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                            تجربة نمط آخر
                          </button>
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
