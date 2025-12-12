import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { AppState, ImageAnalysis } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini } from './services/geminiService';
import { X, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentStep: 'upload',
    image: null,
    analysis: null,
  });
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

  const handleImageSelect = async (base64: string) => {
    setState({ ...state, currentStep: 'analyzing', image: base64 });
    setLoading(true);

    try {
      const analysis = await analyzeImageWithGemini(base64);
      setState(prev => ({ 
        ...prev, 
        currentStep: 'results', 
        analysis: analysis 
      }));
      setCurrentDescription(analysis.prompt);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("حدث خطأ أثناء تحليل الصورة. الرجاء المحاولة مجدداً.");
      setState(prev => ({ ...prev, currentStep: 'upload', image: null }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setState({ currentStep: 'upload', image: null, analysis: null });
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
      alert("تعذر تحديث الوصف. الرجاء المحاولة مجدداً.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleShare = async () => {
    // Simulate generating a unique share link
    const shareId = Math.random().toString(36).substring(2, 9);
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
    
    const shareData = {
      title: 'نتائج تحليل لومينا',
      text: `شاهد تحليل الصورة ووصفها المقترح:\n\n${currentDescription.substring(0, 100)}...`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('تم نسخ رابط المشاركة الخاص إلى الحافظة!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-dark dark:text-gray-100 font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-300">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)]">
        
        {state.currentStep === 'upload' && (
          <div className="animate-fade-in">
            <Hero onImageSelect={handleImageSelect} />
          </div>
        )}

        {(state.currentStep === 'analyzing' || state.currentStep === 'results') && state.image && (
          <div className="max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-dark dark:text-white">
                {state.currentStep === 'analyzing' ? 'جاري تحليل الصورة...' : 'نتائج التحليل والوصف'}
              </h2>
              <div className="flex gap-2">
                {state.currentStep === 'results' && (
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5 dark:text-gray-400 dark:hover:text-primary dark:hover:bg-gray-800"
                    title="مشاركة النتائج"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">مشاركة</span>
                  </button>
                )}
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                  إغلاق
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column: Image Viewer */}
              <div className="w-full">
                <ImageViewer 
                  imageSrc={state.image} 
                />
              </div>

              {/* Right Column: Analysis Panel */}
              <div className="w-full">
                <div className="bg-subtle-pattern dark:bg-gray-800/50 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 h-full transition-colors duration-300">
                  <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2 text-dark dark:text-white">
                    <span className="w-2 h-6 bg-primary rounded-full"></span>
                    تحليل الصورة والوصف
                  </h3>
                  <AnalysisPanel 
                    analysis={state.analysis} 
                    currentDescription={currentDescription}
                    loading={loading}
                    isRefining={isRefining}
                    onRefineDescription={handleRefineDescription}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default App;