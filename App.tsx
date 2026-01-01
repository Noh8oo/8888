
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ChatWidget } from './components/ChatWidget';
import { ArtisticGallery } from './components/ArtisticGallery';
import { AppState, ToolMode, RemixStyle } from './types';
import { analyzeImageWithGemini, refineDescriptionWithGemini, remixImageWithGemini } from './services/geminiService';
import { Share2, RefreshCw, Download, Sparkles, Check, AlertCircle, ArrowLeft, Microscope, Maximize, Zap, Film, Wand2, Send, Palette, Eraser, CloudRain, PenTool, Sun } from 'lucide-react';
import { Button } from './components/Button';

// Refactored: Simplified to 4 Core Tools to avoid user confusion
const ENHANCEMENT_TOOLS: RemixStyle[] = [
  { 
    id: 'smart_enhance', 
    name: 'تحسين شامل (Auto Enhance)', 
    icon: <Sparkles className="w-8 h-8" />, 
    color: 'bg-blue-500', 
    prompt: 'Professional image enhancement: Correct colors, balance lighting, remove noise, and apply subtle sharpening for a crystal clear look.' 
  },
  { 
    id: 'super_res', 
    name: 'رفع الدقة (Super Res 4K)', 
    icon: <Maximize className="w-8 h-8" />, 
    color: 'bg-emerald-500', 
    prompt: 'Upscale to 4K resolution: High fidelity restoration, remove pixelation, sharpen edges, and reconstruct missing high-frequency details.' 
  },
  { 
    id: 'restoration', 
    name: 'ترميم وتوضيح (Restoration)', 
    icon: <Microscope className="w-8 h-8" />, 
    color: 'bg-violet-500', 
    prompt: 'Image restoration: Fix blur, denoise heavily, enhance facial details, improve clarity, and restore degraded quality.' 
  },
  { 
    id: 'custom_edit', 
    name: 'تعديل سحري (Magic Edit)', 
    icon: <Wand2 className="w-8 h-8" />, 
    color: 'bg-pink-500', 
    prompt: 'CUSTOM' 
  },
];

const SUGGESTIONS = [
  { id: 'retro', text: 'Add a vintage retro filter', label: 'فلتر قديم (Retro)', icon: <Palette className="w-3 h-3" /> },
  { id: 'remove_bg', text: 'Remove the person in the background', label: 'حذف أشخاص من الخلفية', icon: <Eraser className="w-3 h-3" /> },
  { id: 'rain', text: 'Make it a rainy cyberpunk city', label: 'أجواء سايبر بانك ماطرة', icon: <CloudRain className="w-3 h-3" /> },
  { id: 'sketch', text: 'Convert to a pencil sketch', label: 'رسم بقلم الرصاص', icon: <PenTool className="w-3 h-3" /> },
  { id: 'sunset', text: 'Change lighting to golden hour sunset', label: 'إضاءة غروب الشمس', icon: <Sun className="w-3 h-3" /> },
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
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

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
    // If Custom Edit is selected, switch to input mode
    if (style.id === 'custom_edit') {
      setSelectedStyle(style);
      setCustomPrompt(''); // Reset prompt
      setState(prev => ({ ...prev, currentStep: 'custom-prompt-input', error: null }));
      return;
    }

    // Normal predefined style flow
    const sourceImage = originalImage;
    if (!sourceImage) return;
    
    setSelectedStyle(style);
    setState(prev => ({ ...prev, currentStep: 'processing', error: null }));
    setLoading(true);

    try {
      const remixedImage = await remixImageWithGemini(sourceImage, style.prompt, 'restore');
      setState(prev => ({ ...prev, currentStep: 'results', image: remixedImage }));
    } catch (error: any) {
      console.error("Enhance Error:", error);
      setState(prev => ({ ...prev, currentStep: 'results', error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleCustomPromptSubmit = async () => {
    if (!customPrompt.trim() || !originalImage) return;

    setState(prev => ({ ...prev, currentStep: 'processing', error: null }));
    setLoading(true);

    try {
      const remixedImage = await remixImageWithGemini(originalImage, customPrompt, 'creative');
      setState(prev => ({ ...prev, currentStep: 'results', image: remixedImage }));
    } catch (error: any) {
      console.error("Custom Edit Error:", error);
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
    setCustomPrompt('');
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
                <p className="text-gray-600 dark:text-gray-300">{state.error}</p>
                <button onClick={handleReset} className="w-full max-w-xs mx-auto py-4 bg-primary text-white rounded-2xl font-bold">
                  حاول مرة أخرى
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-[1.5rem] shadow-lg bg-blue-100 dark:bg-blue-900/40 text-primary">
                      {state.toolMode === 'remix' ? <Sparkles className="w-6 h-6" /> : <Microscope className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{state.toolMode === 'remix' ? 'محسن البكسلات (Pixel Enhancer)' : 'تحليل لومينا'}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {['analyzing', 'processing'].includes(state.currentStep) ? (
                           <span className="flex items-center gap-2 text-xs text-gray-500 font-bold animate-pulse">
                             <RefreshCw className="w-3 h-3 animate-spin" /> جاري المعالجة...
                           </span>
                        ) : state.currentStep === 'style-selection' ? (
                          <span className="flex items-center gap-2 text-xs text-blue-500 font-bold px-3 py-1 rounded-full">
                            <Sparkles className="w-3 h-3" /> اختر وضع التحسين
                          </span>
                        ) : state.currentStep === 'custom-prompt-input' ? (
                          <span className="flex items-center gap-2 text-xs text-pink-500 font-bold px-3 py-1 rounded-full">
                            <Wand2 className="w-3 h-3" /> صف التعديل المطلوب
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-xs text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                            <Check className="w-3 h-3" /> تم بنجاح
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleReset} className="px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-sm shadow-md">
                    <ArrowLeft className="w-5 h-5" /> العودة
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
                        <a href={state.image || ''} download="lumina_enhanced.png" className="flex items-center justify-center gap-4 bg-primary text-white py-6 rounded-[2rem] font-bold shadow-2xl hover:brightness-110 transition-all">
                          <Download className="w-6 h-6" /> تحميل
                        </a>
                        <button onClick={() => navigator.share && state.image && navigator.share({ title: 'نتائج لومينا', text: 'صورة محسنة', url: window.location.href })} className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-6 rounded-[2rem] font-bold shadow-xl">
                          <Share2 className="w-6 h-6" /> مشاركة
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    {state.currentStep === 'style-selection' && (
                      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-2xl">
                        <h3 className="text-lg font-bold mb-6 text-center text-gray-700 dark:text-gray-200">اختر نوع المعالجة المطلوبة</h3>
                        <ArtisticGallery styles={ENHANCEMENT_TOOLS} onSelect={handleStyleSelect} />
                      </div>
                    )}

                    {state.currentStep === 'custom-prompt-input' && (
                      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-2xl border border-pink-100 dark:border-pink-900/30 animate-slide-in">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 text-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-6">
                            <Wand2 className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">التعديل السحري</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                             اطلب أي تعديل تريده على الصورة باستخدام الذكاء الاصطناعي
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2 mb-2 justify-center">
                             {SUGGESTIONS.map(s => (
                               <button
                                 key={s.id}
                                 onClick={() => setCustomPrompt(s.text)}
                                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 text-xs font-bold border border-pink-100 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
                               >
                                 {s.icon}
                                 {s.label}
                               </button>
                             ))}
                          </div>

                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="مثال: أضف فلتر قديم (Retro)، احذف الشخص الموجود في الخلفية، اجعل السماء تمطر..."
                            className="w-full h-32 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-pink-500/50 outline-none transition-all resize-none text-dark dark:text-white placeholder-gray-400"
                            autoFocus
                          />
                          
                          <div className="flex gap-3">
                             <Button 
                               onClick={() => setState(prev => ({ ...prev, currentStep: 'style-selection' }))}
                               variant="ghost"
                               className="flex-1 py-4 rounded-xl"
                             >
                               إلغاء
                             </Button>
                             <Button 
                               onClick={handleCustomPromptSubmit}
                               disabled={!customPrompt.trim()}
                               className="flex-[2] py-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/30"
                             >
                               <Sparkles className="w-5 h-5 ml-2" />
                               تنفيذ التعديل
                             </Button>
                          </div>
                        </div>
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
