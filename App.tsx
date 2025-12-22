
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { AppState, ImageAnalysis, ToolMode } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, enhanceImageWithGemini } from './services/geminiService';
import { X, Share2, AlertTriangle, Wand2, RefreshCw, Download, Sparkles } from 'lucide-react';

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
            <div className="flex justify-between items-center mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
              <div>
                <h2 className="text-2xl font-bold">
                  {state.currentStep === 'analyzing' || state.currentStep === 'enhancing' ? (
                    <span className="flex items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      {state.toolMode === 'enhance' ? 'جاري التحسين الاحترافي...' : 'جاري التحليل...'}
                    </span>
                  ) : (
                    state.toolMode === 'enhance' ? 'التحسين الفائق مكتمل' : 'نتائج تحليل الصورة'
                  )}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {state.toolMode === 'enhance' ? 'قارن بين النسخة الأصلية والمحسنة' : 'بيانات النمط والألوان'}
                </p>
              </div>
              <div className="flex gap-3">
                {state.currentStep === 'results' && (
                  <button onClick={handleShare} className="p-2.5 bg-white dark:bg-gray-700 rounded-xl hover:text-primary shadow-sm"><Share2 className="w-5 h-5" /></button>
                )}
                <button onClick={handleReset} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl shadow-sm"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${state.toolMode === 'analyze' ? 'lg:grid-cols-2' : 'max-w-4xl mx-auto'} gap-8`}>
              <div className="space-y-4">
                <ImageViewer 
                  imageSrc={state.image || originalImage || ''} 
                  originalSrc={state.toolMode === 'enhance' ? originalImage : null}
                  isEnhancing={state.currentStep === 'enhancing'}
                />
                
                {state.currentStep === 'results' && state.toolMode === 'enhance' && (
                  <div className="flex gap-3">
                    <a 
                      href={state.image || ''} 
                      download="enhanced_lumina.png"
                      className="flex-1 flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-all"
                    >
                      <Download className="w-5 h-5" />
                      تحميل النسخة المحسنة
                    </a>
                    <button onClick={handleReset} className="px-6 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold">جديد</button>
                  </div>
                )}
              </div>

              {state.toolMode === 'analyze' && (
                <div className="bg-subtle-pattern dark:bg-gray-800/50 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                  <AnalysisPanel 
                    analysis={state.analysis} 
                    currentDescription={currentDescription}
                    loading={loading}
                    isRefining={isRefining}
                    onRefineDescription={handleRefineDescription}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {state.toolMode === 'analyze' && <ChatWidget imageAnalysis={state.analysis} />}
    </div>
  );
};

export default App;
