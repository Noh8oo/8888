
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { ArtisticGallery } from './components/ArtisticGallery';
import { AppState, ToolMode, RemixStyle } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, remixImageWithGemini } from './services/geminiService';
import { Share2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft, Zap, Move, Sun, ShieldCheck, Microscope } from 'lucide-react';

// تحويل القائمة من أنماط فنية إلى أدوات تحسين
const ENHANCEMENT_TOOLS: RemixStyle[] = [
  { 
    id: 'upscale', 
    name: 'رفع الدقة (Upscale)', 
    icon: <Microscope className="w-8 h-8" />, 
    color: 'bg-blue-500', 
    prompt: 'Do not change the image content. Act as a super-resolution upscaler. Increase resolution, sharpen details, fix pixelation, and improve overall clarity significantly. Output a high-fidelity version of the original image.' 
  },
  { 
    id: 'denoise', 
    name: 'إزالة التشويش', 
    icon: <ShieldCheck className="w-8 h-8" />, 
    color: 'bg-green-500', 
    prompt: 'Do not change the image content. Remove all digital noise, compression artifacts, and grain. Smooth out the textures while keeping edges sharp. Clean up the image quality.' 
  },
  { 
    id: 'sharpen', 
    name: 'توضيح التفاصيل', 
    icon: <Move className="w-8 h-8" />, 
    color: 'bg-purple-500', 
    prompt: 'Do not change the image content. Sharpen the edges and fine details. Focus on bringing out texture and clarity in blurry areas. Make the image look crisp and focused.' 
  },
  { 
    id: 'relight', 
    name: 'تصحيح الإضاءة', 
    icon: <Sun className="w-8 h-8" />, 
    color: 'bg-orange-500', 
    prompt: 'Do not change the image content. Fix the lighting and exposure. Balance the shadows and highlights. Make the colors look natural and vibrant. Correct any white balance issues.' 
  },
  { 
    id: 'restore', 
    name: 'ترميم وإصلاح', 
    icon: <RefreshCw className="w-8 h-8" />, 
    color: 'bg-teal-500', 
    prompt: 'Do not change the image content. Restore this image quality. Fix scratches, blur, or jpeg artifacts. Enhance the visual fidelity to look like a high-quality professional photo.' 
  },
  { 
    id: 'hdr', 
    name: 'تأثير HDR', 
    icon: <Zap className="w-8 h-8" />, 
    color: 'bg-pink-500', 
    prompt: 'Do not change the image content. Apply a subtle HDR effect to enhance dynamic range. Boost local contrast and color depth without making it look artificial.' 
  },
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
  const [apiImage, setApiImage] = useState<string | null>(null);
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<RemixStyle | null>(null);
  const [longProcessTip, setLongProcessTip] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (loading) {
      setLongProcessTip(false);
      timer = setTimeout(() => setLongProcessTip(true), 6000);
    } else {
      setLongProcessTip(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleImageSelect = async (displayBase64: string, apiBase64: string, mode: ToolMode) => {
    setOriginalImage(displayBase64);
    setApiImage(apiBase64);
    
    if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: 'smooth' });

    if (mode === 'remix') {
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
    setState(prev => ({ ...prev, currentStep: 'processing', error: null }));
    setLoading(true);

    try {
      const remixedImage = await remixImageWithGemini(apiImage, style.prompt);
      setState(prev => ({ ...prev, currentStep: 'results', image: remixedImage }));
    } catch (error: any) {
      console.error("Enhance Final Error:", error);
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
    setLoading(false);
  };

  const getFriendlyErrorMessage = (errorMsg: string) => {
    const msg = (errorMsg || "").toLowerCase();

    if (msg.includes("api_key") || msg.includes("api key") || msg.includes("403")) {
      return "مفتاح API غير صالح. تأكد من إعدادات البيئة.";
    }
    if (msg.includes("safety") || msg.includes("blocked")) {
      return "تم حظر العملية بسبب سياسات الأمان الخاصة بجوجل.";
    }
    if (msg.includes("429") || msg.includes("quota")) {
      return "تم تجاوز حد الاستخدام. يرجى الانتظار قليلاً.";
    }
    if (msg.includes("503") || msg.includes("overloaded")) {
      return "الخدمة مشغولة جداً حالياً، حاول مرة أخرى.";
    }

    return "حدث خطأ أثناء معالجة الصورة. يرجى المحاولة لاحقاً.";
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
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">عذراً، لم تكتمل العملية</h3>
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-medium">
                    {getFriendlyErrorMessage(state.error)}
                  </p>
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
                      state.toolMode === 'remix' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-blue-100 dark:bg-blue-900/40 text-primary'
                    }`}>
                      {state.toolMode === 'remix' ? <Sparkles className="w-6 h-6" /> : <Microscope className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {state.toolMode === 'remix' ? 'محسن الصور الذكي' : 'تحليل لومينا'}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {['analyzing', 'processing'].includes(state.currentStep) ? (
                          <div className="flex flex-col items-start">
                             <span className="flex items-center gap-2 text-xs text-gray-500 font-bold animate-pulse">
                               <RefreshCw className="w-3 h-3 animate-spin" /> 
                               {state.toolMode === 'remix' ? 'جاري تحسين البكسلات...' : 'جاري التحليل...'}
                             </span>
                             {longProcessTip && (
                               <span className="text-[10px] text-orange-500 font-medium mt-1 animate-fade-in">
                                  تستغرق عملية التحسين عالية الدقة بعض الوقت...
                               </span>
                             )}
                          </div>
                        ) : state.currentStep === 'style-selection' ? (
                          <span className="flex items-center gap-2 text-xs text-blue-500 font-bold px-3 py-1 rounded-full">
                            <Sparkles className="w-3 h-3" /> اختر نوع التحسين
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-xs text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                            <Check className="w-3 h-3" /> تم التحسين بنجاح
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
                          download="lumina_enhanced.png"
                          className="flex items-center justify-center gap-4 bg-primary text-white py-6 rounded-[2rem] font-bold shadow-2xl hover:brightness-110 transition-all"
                        >
                          <Download className="w-6 h-6" /> تحميل الصورة المحسنة
                        </a>
                        <button 
                          onClick={() => navigator.share && state.image && navigator.share({ title: 'نتائج لومينا', text: 'صورة محسنة بالذكاء الاصطناعي', url: window.location.href })}
                          className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-6 rounded-[2rem] font-bold shadow-xl border border-gray-100 transition-all"
                        >
                          <Share2 className="w-6 h-6" /> مشاركة
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    {/* Enhancement Selection Panel */}
                    {state.currentStep === 'style-selection' && (
                      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-700 animate-slide-in">
                        <div className="flex items-center gap-2 mb-6">
                           <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                             <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">أدوات التحسين</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">اختر الطريقة المناسبة لمعالجة صورتك</p>
                           </div>
                        </div>
                        
                        <ArtisticGallery styles={ENHANCEMENT_TOOLS} onSelect={handleStyleSelect} />
                        
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
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-12 rounded-[3rem] text-white shadow-2xl border border-white/10">
                          <h3 className="text-3xl font-extrabold mb-6 flex items-center gap-3">
                             <Check className="w-8 h-8 text-green-300" />
                             اكتمل التحسين!
                          </h3>
                          <p className="text-lg text-white/80 leading-relaxed font-medium mb-4">
                               تمت معالجة الصورة بنجاح باستخدام أداة <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-lg">{selectedStyle?.name}</span>.
                          </p>
                          <button onClick={handleReset} className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                            تحسين صورة أخرى
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
