
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { AppState, ToolMode } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, remixImageWithGemini } from './services/geminiService';
import { Share2, Download, Check, AlertCircle, ArrowLeft, Zap } from 'lucide-react';

const ENHANCE_PROMPT = "High-definition restoration, sharpen details, remove artifacts, 8k resolution, photorealistic, maintain original composition and lighting.";

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
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleImageSelect = async (displayBase64: string, apiBase64: string, mode: ToolMode) => {
    setOriginalImage(displayBase64);
    setApiImage(apiBase64); 
    
    if (mode === 'remix') {
      setState(prev => ({ ...prev, currentStep: 'style-selection', toolMode: mode, image: displayBase64, error: null }));
    } else {
      setState(prev => ({ ...prev, currentStep: 'analyzing', toolMode: mode, image: displayBase64, error: null }));
      setLoading(true);
      setStatus("جاري تحليل الصورة...");
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

  const handleEnhanceClick = async () => {
    if (!apiImage) return;
    setLoading(true);
    setStatus("جاري توضيح البكسلات...");
    setState(prev => ({ ...prev, currentStep: 'processing', error: null }));

    try {
      const result = await remixImageWithGemini(apiImage, ENHANCE_PROMPT);
      setState(prev => ({ ...prev, currentStep: 'results', image: result }));
    } catch (error: any) {
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefining(false);
    }
  };

  const handleReset = () => {
    setState({ currentStep: 'upload', toolMode: null, image: null, analysis: null, error: null });
    setOriginalImage(null);
    setApiImage(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors duration-300 font-sans">
      <Header isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} highlightSupport={state.currentStep === 'results'} />
      
      <main className="container mx-auto px-4 py-10">
        {state.currentStep === 'upload' && <Hero onImageSelect={handleImageSelect} />}

        {state.currentStep !== 'upload' && (
          <div className="max-w-6xl mx-auto">
            {state.error ? (
              <div className="text-center p-10 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-600 mb-2">فشلت العملية</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{state.error}</p>
                <button onClick={handleReset} className="px-8 py-3 bg-primary text-white rounded-xl font-bold">العودة للبداية</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                     <button onClick={handleReset} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                       <ArrowLeft className="w-4 h-4" /> العودة
                     </button>
                     <div className="text-xs font-bold text-gray-400">{status}</div>
                  </div>
                  <ImageViewer 
                    imageSrc={state.image || originalImage || ''} 
                    originalSrc={originalImage}
                    isEnhancing={loading && state.currentStep === 'processing'}
                  />
                  {state.currentStep === 'results' && (
                    <div className="flex gap-4">
                      <a href={state.image || ''} download="lumina_result.png" className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                        <Download className="w-5 h-5" /> تحميل
                      </a>
                      <button className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-300">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {state.currentStep === 'style-selection' && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl text-center">
                      <Zap className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold mb-4">توضيح البكسلات</h3>
                      <p className="text-gray-500 mb-8">سيتم ترميم الصورة ورفع دقتها باستخدام الذكاء الاصطناعي.</p>
                      <button onClick={handleEnhanceClick} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20">ابدأ المعالجة</button>
                    </div>
                  )}
                  {state.analysis && (
                    <AnalysisPanel 
                      analysis={state.analysis} 
                      currentDescription={currentDescription}
                      loading={loading}
                      isRefining={isRefining}
                      onRefineDescription={handleRefineDescription}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
