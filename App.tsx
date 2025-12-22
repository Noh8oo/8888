

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { ArtisticGallery, ArtisticStyle } from './components/ArtisticGallery';
import { AppState, ImageAnalysis, ToolMode } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, enhanceImageWithGemini, transformImageWithGemini } from './services/geminiService';
// Fixed missing 'Check' icon import
import { X, Share2, AlertTriangle, Wand2, RefreshCw, Download, Sparkles, Palette, Check } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentStep: 'upload',
    toolMode: null,
    image: null,
    analysis: null,
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
    
    if (mode === 'enhance') {
      setState({ ...state, currentStep: 'enhancing', toolMode: 'enhance', image: base64 });
      setLoading(true);
      try {
        const enhancedBase64 = await enhanceImageWithGemini(base64);
        setState(prev => ({ ...prev, currentStep: 'results', image: enhancedBase64 }));
      } catch (error) {
        console.error("Enhancement failed", error);
        alert("تعذر تحسين جودة الصورة حالياً.");
        setState(prev => ({ ...prev, currentStep: 'upload', toolMode: null }));
      } finally {
        setLoading(false);
      }
    } else if (mode === 'transform') {
      // In transform mode, we first show the uploaded image and the gallery
      setState({ ...state, currentStep: 'results', toolMode: 'transform', image: base64 });
    } else {
      setState({ ...state, currentStep: 'analyzing', toolMode: 'analyze', image: base64 });
      setLoading(true);
      try {
        const analysis = await analyzeImageWithGemini(base64);
        setState(prev => ({ ...prev, currentStep: 'results', analysis: analysis }));
        setCurrentDescription(analysis.prompt);
      } catch (error) {
        console.error("Analysis failed", error);
        alert("حدث خطأ أثناء تحليل الصورة.");
        setState(prev => ({ ...prev, currentStep: 'upload', toolMode: null }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApplyStyle = async (style: ArtisticStyle) => {
    if (!originalImage) return;
    
    setState(prev => ({ ...prev, currentStep: 'transforming' }));
    setLoading(true);
    try {
      const transformedBase64 = await transformImageWithGemini(originalImage, style.instruction);
      setState(prev => ({ ...prev, currentStep: 'results', image: transformedBase64 }));
    } catch (error) {
      console.error("Transformation failed", error);
      alert("حدث خطأ أثناء تطبيق النمط الفني.");
      setState(prev => ({ ...prev, currentStep: 'results' })); // Stay in results but with old image
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setState({ currentStep: 'upload', toolMode: null, image: null, analysis: null });
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
          <h2 className="text-xl font-bold mb-2">API Key Mismatch</h2>
          <p className="text-gray-500 mb-6">يرجى ضبط مفتاح Gemini في بيئة العمل.</p>
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
      
      <main className="container mx-auto px-4 py-8">
        {state.currentStep === 'upload' && <Hero onImageSelect={handleImageSelect} />}

        {(state.currentStep !== 'upload') && (
          <div className="max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl shadow-sm">
              <div>
                <h2 className="text-2xl font-bold">
                  {['analyzing', 'enhancing', 'transforming'].includes(state.currentStep) ? (
                    <span className="flex items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      {state.toolMode === 'enhance' ? 'جاري التحسين...' : state.toolMode === 'transform' ? 'جاري التحويل الفني...' : 'جاري التحليل...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                       {state.toolMode === 'enhance' && <Wand2 className="w-6 h-6 text-purple-500" />}
                       {state.toolMode === 'transform' && <Palette className="w-6 h-6 text-orange-500" />}
                       {state.toolMode === 'analyze' && <Sparkles className="w-6 h-6 text-primary" />}
                       {state.toolMode === 'enhance' ? 'التحسين الفائق' : state.toolMode === 'transform' ? 'استوديو الفن الذكي' : 'تحليل لومينا الذكي'}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {state.toolMode === 'enhance' ? 'رفع الجودة بتقنيات AI' : state.toolMode === 'transform' ? 'تحويل الصور لأنماط فنية' : 'استخراج بيانات الصورة المعمقة'}
                </p>
              </div>
              <div className="flex gap-3">
                {state.currentStep === 'results' && (
                  <button onClick={handleShare} className="p-2.5 bg-white dark:bg-gray-700 rounded-xl hover:text-primary shadow-sm"><Share2 className="w-5 h-5" /></button>
                )}
                <button onClick={handleReset} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl shadow-sm"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${state.toolMode === 'enhance' || state.toolMode === 'transform' ? 'lg:grid-cols-[1fr_400px]' : 'lg:grid-cols-2'} gap-8`}>
              <div className="space-y-4">
                <ImageViewer 
                  imageSrc={state.image || originalImage || ''} 
                  originalSrc={originalImage}
                  isEnhancing={['enhancing', 'transforming'].includes(state.currentStep)}
                />
                
                {state.currentStep === 'results' && (
                  <div className="flex gap-3">
                    <a 
                      href={state.image || ''} 
                      download="lumina_output.png"
                      className="flex-1 flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-all"
                    >
                      <Download className="w-5 h-5" />
                      تحميل الصورة
                    </a>
                    <button onClick={handleReset} className="px-6 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold">إغلاق</button>
                  </div>
                )}
              </div>

              <div className="h-full">
                {state.toolMode === 'analyze' && (
                  <div className="bg-subtle-pattern dark:bg-gray-800/50 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
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
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                    <ArtisticGallery 
                      onSelectStyle={handleApplyStyle} 
                      isLoading={loading}
                    />
                  </div>
                )}
                
                {state.toolMode === 'enhance' && state.currentStep === 'results' && (
                   <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-3xl border border-green-100 dark:border-green-900/30 text-center flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">اكتمل التحسين!</h3>
                      <p className="text-sm text-green-700/70 dark:text-green-400/70">تمت معالجة الصورة بنجاح. يمكنك الآن مقارنة النتائج وتحميل النسخة المحسنة بدقة عالية.</p>
                      <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-inner w-full text-xs text-gray-400">
                        استخدم شريط التمرير على الصورة لرؤية التفاصيل المستعادة.
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {state.toolMode === 'analyze' && <ChatWidget imageAnalysis={state.analysis} />}
    </div>
  );
};

export default App;
