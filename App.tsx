
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { ArtisticGallery, ArtisticStyle } from './components/ArtisticGallery';
import { AppState, ImageAnalysis, ToolMode } from './types';
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
    setState(prev => ({ ...prev, error: null }));
    
    if (mode === 'enhance') {
      setState(prev => ({ ...prev, currentStep: 'enhancing', toolMode: 'enhance', image: base64 }));
      setLoading(true);
      try {
        const enhancedBase64 = await enhanceImageWithGemini(base64);
        setState(prev => ({ ...prev, currentStep: 'results', image: enhancedBase64 }));
      } catch (error) {
        console.error("Enhancement failed", error);
        setState(prev => ({ ...prev, currentStep: 'results', error: "تعذر تحسين جودة الصورة حالياً. قد يكون السبب حجم الملف الكبير أو مشكلة مؤقتة في الخادم." }));
      } finally {
        setLoading(false);
      }
    } else if (mode === 'transform') {
      setState(prev => ({ ...prev, currentStep: 'results', toolMode: 'transform', image: base64 }));
    } else {
      setState(prev => ({ ...prev, currentStep: 'analyzing', toolMode: 'analyze', image: base64 }));
      setLoading(true);
      try {
        const analysis = await analyzeImageWithGemini(base64);
        setState(prev => ({ ...prev, currentStep: 'results', analysis: analysis }));
        setCurrentDescription(analysis.prompt);
      } catch (error) {
        console.error("Analysis failed", error);
        setState(prev => ({ ...prev, currentStep: 'results', error: "حدث خطأ أثناء تحليل الصورة. يرجى المحاولة مع صورة أخرى." }));
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
      console.error("Transformation failed", error);
      setState(prev => ({ ...prev, currentStep: 'results', error: "حدث خطأ أثناء تطبيق النمط الفني." }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setState({ currentStep: 'upload', toolMode: null, image: null, analysis: null, error: null });
    setOriginalImage(null);
    setCurrentDescription('');
  };

  const handleRefineDescription = async (instruction: string) => {
    if (!currentDescription) return;
    setIsRefining(true);
    try {
      const refinedText = await refineDescriptionWithGemini(currentDescription, instruction);
      setCurrentDescription(refinedText);
    } catch (error) {
      console.error("Refinement failed", error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleShare = async () => {
    if (!state.image) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'نتائج لومينا', url: window.location.href });
      }
    } catch (err) {}
  };

  if (apiKeyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">API Key Required</h2>
          <p className="text-gray-500 mb-6">يرجى ضبط مفتاح Gemini في بيئة العمل ليعمل التطبيق.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors duration-300">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        highlightSupport={state.currentStep === 'results'} 
      />
      
      <main className="container mx-auto px-4 py-4 lg:py-6">
        {state.currentStep === 'upload' && <Hero onImageSelect={handleImageSelect} />}

        {(state.currentStep !== 'upload') && (
          <div className="max-w-7xl mx-auto animate-fade-in">
            {/* Header Area (Very Compact) */}
            <div className="flex items-center justify-between gap-4 mb-4 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  state.toolMode === 'enhance' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                  state.toolMode === 'transform' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                  'bg-blue-100 dark:bg-blue-900/30 text-primary'
                }`}>
                  {state.toolMode === 'enhance' && <Wand2 className="w-4 h-4" />}
                  {state.toolMode === 'transform' && <Palette className="w-4 h-4" />}
                  {state.toolMode === 'analyze' && <Sparkles className="w-4 h-4" />}
                </div>
                <h2 className="text-base font-bold hidden sm:block">
                  {state.toolMode === 'enhance' ? 'تحسين الصورة' : state.toolMode === 'transform' ? 'الاستوديو الفني' : 'تحليل لومينا'}
                </h2>
                {state.currentStep === 'results' && !state.error && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-bold">
                    <Check className="w-3 h-3" />
                    جاهز
                  </div>
                )}
              </div>

              <button 
                onClick={handleReset} 
                className="px-4 py-2 bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                بداية جديدة
              </button>
            </div>

            {state.error ? (
              <div className="max-w-xl mx-auto py-12 text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold">عذراً، حدث خطأ</h3>
                <p className="text-gray-500 text-sm">{state.error}</p>
                <button onClick={handleReset} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">حاول مجدداً</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
                
                {/* Left Column: Image and Actions */}
                <div className="space-y-4">
                  <ImageViewer 
                    imageSrc={state.image || originalImage || ''} 
                    originalSrc={originalImage}
                    isEnhancing={['enhancing', 'transforming'].includes(state.currentStep)}
                  />
                  
                  {state.currentStep === 'results' && !state.error && (
                    <div className="grid grid-cols-2 gap-3">
                      <a 
                        href={state.image || ''} 
                        download="lumina_result.png"
                        className="flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm"
                      >
                        <Download className="w-4 h-4" />
                        حفظ في الجهاز
                      </a>
                      <button 
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-3.5 rounded-2xl font-bold active:scale-95 transition-all text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        مشاركة النتيجة
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column: Details & Tools */}
                <div className="space-y-4">
                  {state.toolMode === 'analyze' && (
                    <div className="bg-subtle-pattern dark:bg-gray-800/50 rounded-3xl p-5 border border-gray-100 dark:border-gray-700">
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
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xl border border-gray-100 dark:border-gray-700">
                      <ArtisticGallery 
                        onSelectStyle={handleApplyStyle} 
                        isLoading={loading}
                      />
                    </div>
                  )}
                  
                  {state.toolMode === 'enhance' && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-3xl text-white shadow-xl">
                         <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                            <h3 className="font-bold text-sm">تم رفع الدقة بنجاح</h3>
                         </div>
                         <p className="text-[10px] mt-2 opacity-90 leading-relaxed">
                            تم تحليل البكسلات المفقودة وتعويضها بذكاء اصطناعي فائق الجودة. يمكنك الآن تجربة النمط الفني لهذه الصورة.
                         </p>
                      </div>

                      <button 
                         onClick={() => setState(prev => ({ ...prev, toolMode: 'transform' }))}
                         className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl group hover:border-orange-500 transition-all"
                      >
                         <div className="flex items-center gap-3">
                            <Palette className="w-5 h-5 text-orange-500" />
                            <span className="text-sm font-bold">تحويل إلى نمط فني</span>
                         </div>
                         <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </button>
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
