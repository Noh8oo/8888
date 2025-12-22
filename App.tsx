
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { AppState, ToolMode, RemixStyle } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, remixImageWithGemini } from './services/geminiService';
import { Share2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft, Palette, Zap, ScanFace } from 'lucide-react';

// تم استبدال القائمة بـ Prompt واحد مخصص للتحسين
const ENHANCE_PROMPT = "Super resolution, upscale image, sharpen details, clarify pixels, remove blur, de-noise, high fidelity, 4k quality, photorealistic, maintain original colors and composition exactly.";

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
  
  const [status, setStatus] = useState<string>("");

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
      setStatus("الصورة جاهزة للتحسين");
      // الانتقال لمرحلة التأكيد قبل البدء
      setState(prev => ({ ...prev, currentStep: 'style-selection', toolMode: mode, image: displayBase64, error: null }));
    } else {
      setState(prev => ({ ...prev, currentStep: 'analyzing', toolMode: mode, image: displayBase64, error: null }));
      setLoading(true);
      setStatus("جاري تحليل الصورة...");
      try {
        const analysis = await analyzeImageWithGemini(apiBase64);
        setStatus("تم التحليل بنجاح!");
        setState(prev => ({ ...prev, currentStep: 'results', analysis: analysis }));
        setCurrentDescription(analysis.prompt);
      } catch (error: any) {
        setStatus("حدث خطأ في الاتصال");
        setState(prev => ({ ...prev, currentStep: 'results', error: error.message }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEnhanceClick = async () => {
    if (!apiImage) return;
    
    setState(prev => ({ ...prev, currentStep: 'processing', error: null }));
    setLoading(true);
    setStatus("جاري معالجة البكسلات وتوضيح الصورة...");

    try {
      // الاتصال المباشر للتحسين
      const remixedImage = await remixImageWithGemini(apiImage, ENHANCE_PROMPT);
      setStatus("تم التحسين بنجاح!");
      setState(prev => ({ ...prev, currentStep: 'results', image: remixedImage }));
    } catch (error: any) {
      console.error("Enhance Error:", error);
      setStatus("فشل التحسين");
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
    setLoading(false);
    setStatus("");
  };

  const getFriendlyErrorMessage = (errorMsg: string) => {
    // API Key Errors
    if (errorMsg.includes("ERROR_API_KEY_MISSING")) {
      return "لم يتم العثور على مفتاح API صالح. يرجى التحقق من إعدادات البيئة.";
    }
    
    // Size Errors
    if (errorMsg.includes("ERROR_IMAGE_TOO_LARGE") || errorMsg.includes("413")) {
      return "حجم الصورة كبير جداً للمعالجة (أكبر من الحد المسموح). يرجى استخدام صورة أصغر حجماً.";
    }

    // Quota/Rate Limit Errors
    if (errorMsg.includes("ERROR_QUOTA_EXCEEDED") || errorMsg.includes("429")) {
      return "الخدمة مشغولة جداً حالياً أو تم استنفاد الرصيد المجاني. يرجى المحاولة بعد دقيقة.";
    }

    // Model Availability Errors (Geo-blocking or Deprecation)
    if (errorMsg.includes("ERROR_MODEL_NOT_FOUND") || errorMsg.includes("404") || errorMsg.includes("not found")) {
      return "نموذج تحسين الصور (Gemini 2.5) غير متاح في منطقتك الجغرافية حالياً، أو أن مفتاح API لا يملك صلاحية الوصول إليه.";
    }

    // Safety Filters
    if (errorMsg.includes("SAFETY") || errorMsg.includes("BLOCKED") || errorMsg.includes("HarmCategory")) {
      return "تم إيقاف المعالجة لأن الصورة قد تحتوي على محتوى لا يتوافق مع معايير السلامة الخاصة بـ Google.";
    }

    // Empty Responses
    if (errorMsg.includes("NO_IMAGE_RETURNED") || errorMsg.includes("EMPTY_RESPONSE")) {
      return "لم يقم النموذج بإرجاع نتيجة. قد تكون الصورة غير واضحة أو معقدة للغاية.";
    }

    // Generic Fallback
    return `حدث خطأ غير متوقع أثناء المعالجة. (${errorMsg.substring(0, 40)}...)`;
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
                      state.toolMode === 'remix' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-blue-100 dark:bg-blue-900/40 text-primary'
                    }`}>
                      {state.toolMode === 'remix' ? <Zap className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {state.toolMode === 'remix' ? 'توضيح الصورة' : 'تحليل لومينا'}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {['analyzing', 'processing'].includes(state.currentStep) ? (
                          <div className="flex flex-col items-start">
                             <span className="flex items-center gap-2 text-xs text-gray-500 font-bold animate-pulse">
                               <RefreshCw className="w-3 h-3 animate-spin" /> 
                               {status}
                             </span>
                          </div>
                        ) : state.currentStep === 'style-selection' ? (
                          <span className="flex items-center gap-2 text-xs text-emerald-600 font-bold px-3 py-1 rounded-full">
                            <Zap className="w-3 h-3" /> الصورة جاهزة
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
                          download="lumina_enhanced.png"
                          className="flex items-center justify-center gap-4 bg-primary text-white py-6 rounded-[2rem] font-bold shadow-2xl hover:brightness-110 transition-all"
                        >
                          <Download className="w-6 h-6" /> تحميل الصورة المحسنة
                        </a>
                        <button 
                          onClick={() => navigator.share && state.image && navigator.share({ title: 'نتائج لومينا', text: 'صورة محسنة', url: window.location.href })}
                          className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-6 rounded-[2rem] font-bold shadow-xl border border-gray-100 transition-all"
                        >
                          <Share2 className="w-6 h-6" /> مشاركة
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    {/* Enhance Confirmation Panel */}
                    {state.currentStep === 'style-selection' && state.toolMode === 'remix' && (
                      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-700 animate-slide-in text-center flex flex-col items-center justify-center h-full max-h-[500px]">
                        <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                          <ScanFace className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-dark dark:text-white">الصورة جاهزة للتوضيح</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                          سيقوم النظام الآن بإعادة بناء بكسلات الصورة لرفع دقتها وإزالة التشويش مع الحفاظ على ملامحها الأصلية.
                        </p>
                        
                        <button
                          onClick={handleEnhanceClick}
                          className="w-full max-w-sm py-5 bg-emerald-600 text-white text-lg rounded-2xl font-bold shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                          <Zap className="w-6 h-6 fill-current" />
                          ابدأ التحسين وتوضيح البكسلات
                        </button>
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
                      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-12 rounded-[3rem] text-white shadow-2xl border border-white/10">
                          <h3 className="text-3xl font-extrabold mb-6 flex items-center gap-3">
                             <Check className="w-8 h-8 text-white" />
                             تمت العملية بنجاح!
                          </h3>
                          <p className="text-lg text-white/80 leading-relaxed font-medium mb-4">
                               أصبحت صورتك الآن أكثر وضوحاً ودقة. يمكنك استخدام أداة المقارنة على اليسار لرؤية الفرق.
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
