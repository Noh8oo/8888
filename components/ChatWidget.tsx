
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bell } from 'lucide-react';
import { chatWithGemini } from '../services/geminiService';
import { ChatMessage, ImageAnalysis } from '../types';

interface ChatWidgetProps {
  imageAnalysis: ImageAnalysis | null;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ imageAnalysis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewInsight, setHasNewInsight] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'مرحباً! أنا مساعدك الذكي للتصميم. اسألني أي شيء عن تحليل الصور أو اتجاهات التصميم.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAnalyzedImageRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Reactive Logic: Respond to new image analysis
  useEffect(() => {
    if (imageAnalysis && imageAnalysis.prompt !== lastAnalyzedImageRef.current) {
      lastAnalyzedImageRef.current = imageAnalysis.prompt;
      triggerAutoInsight(imageAnalysis);
    }
  }, [imageAnalysis]);

  const triggerAutoInsight = async (analysis: ImageAnalysis) => {
    // Show visual notification pulse
    setHasNewInsight(true);
    
    // Prepare a proactive prompt for the AI
    const proactivePrompt = `لقد قمت للتو بتحليل صورة للمستخدم. 
    تفاصيل الصورة: النمط: ${analysis.style}، العناصر: ${analysis.objects.join(', ')}، الوصف: ${analysis.prompt}.
    بصفتك خبير تصميم، رحب بالمستخدم بشكل مختصر جداً وأظهر أنك "رأيت" الصورة، ثم قدم فكرتين إبداعيتين لما يمكن فعله بهذا التصميم (مثلاً اقتراح لدمج عناصر، أو فكرة لمشروع فني مرتبط).
    اجعل الرد ملهمًا وقصيرًا وباللغة العربية.`;

    setIsTyping(true);
    try {
      // We send this as a "system" request but it appears as a model turn
      const responseText = await chatWithGemini([], proactivePrompt);

      const insightMsg: ChatMessage = {
        id: `insight-${Date.now()}`,
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, insightMsg]);
    } catch (error) {
      console.error("Auto-insight failed:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setHasNewInsight(false); // Reset notification on interaction

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const responseText = await chatWithGemini(history, userMsg.text);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "أواجه مشكلة في الاتصال حالياً. الرجاء المحاولة لاحقاً.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setHasNewInsight(false); // Clear notification when opened
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden animate-slide-in origin-bottom-right transition-colors duration-300">
          <div className="bg-primary/5 dark:bg-primary/10 p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-dark dark:text-white">المساعد الذكي</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-dark dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tl-none' 
                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-tr-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-2xl rounded-tr-none shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اسأل شيئاً..."
                className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl px-4 py-2 text-sm text-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-600 transition-all outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <div className="relative">
        {hasNewInsight && !isOpen && (
          <>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 z-10 animate-bounce flex items-center justify-center">
              <Bell className="w-3 h-3 text-white fill-current" />
            </div>
            <div className="absolute inset-0 rounded-full animate-chat-pulse z-0"></div>
          </>
        )}
        <button 
          onClick={toggleChat}
          className={`relative z-10 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center ${hasNewInsight && !isOpen ? 'animate-bounce' : ''}`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className={`w-6 h-6 ${hasNewInsight ? 'animate-pulse' : ''}`} />}
        </button>
      </div>
    </div>
  );
};
