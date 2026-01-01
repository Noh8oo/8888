
import { GoogleGenAI } from "@google/genai";
import { ImageAnalysis } from "../types";

// استخدام مفتاح API من البيئة أو المفتاح المباشر كاحتياطي
const API_KEY = process.env.API_KEY || "AIzaSyD8tNXgDiYG9yDjNSVyC_dYIqzPe8lhuSs";
const ai = new GoogleGenAI({ apiKey: API_KEY });

// استخدام الموديل الأحدث لتجنب أخطاء 404
const MODEL_NAME = 'gemini-3-flash-preview';

const cleanBase64Data = (base64: string): string => {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

// إعدادات الأمان
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

const getFriendlyErrorMessage = (error: any): string => {
  const msg = error?.toString() || "";
  if (msg.includes("API key") || msg.includes("403")) return "مفتاح API غير صالح.";
  if (msg.includes("404") || msg.includes("NOT_FOUND")) return "الموديل غير متوفر حالياً، يرجى المحاولة لاحقاً.";
  if (msg.includes("Failed to call") || msg.includes("fetch")) return "مشكلة في الاتصال بالإنترنت.";
  if (msg.includes("429")) return "الخدمة مشغولة جداً، حاول بعد دقيقة.";
  if (msg.includes("SAFETY")) return "تم حظر الصورة بواسطة فلاتر الأمان.";
  return "حدث خطأ غير متوقع.";
};

// ---------------------------------------------------------
// خدمة التحليل
// ---------------------------------------------------------

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  try {
    const cleanImage = cleanBase64Data(base64Image);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanImage } },
          { text: `Analyze this image precisely. Return valid JSON only: { "colors": [], "style": "Arabic", "layout": "Arabic", "layoutDetail": "Arabic", "view": "Arabic", "viewDetail": "Arabic", "objects": ["Arabic"], "prompt": "Arabic" }` }
        ]
      }],
      config: { 
        responseMimeType: "application/json",
        safetySettings: SAFETY_SETTINGS,
      }
    });

    const text = response.text || "{}";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as ImageAnalysis;
  } catch (error) {
    console.error("Analysis Error Details:", error);
    return {
      colors: ["#eee", "#ddd"], style: "غير محدد", layout: "فشل التحليل", view: "-", objects: [], 
      prompt: `عذراً: ${getFriendlyErrorMessage(error)}`
    };
  }
};

// ---------------------------------------------------------
// خدمة المعالجة والتحسين (Engine)
// ---------------------------------------------------------

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  warmth: number;
  sharpenAmount: number;
  vignette: number;
  upscale: boolean; // معلمة جديدة لرفع الدقة
}

const getEnhancementParameters = async (base64Image: string, instruction: string): Promise<ImageAdjustments> => {
  const safeDefaults: ImageAdjustments = { 
    brightness: 1.02, 
    contrast: 1.05, 
    saturation: 1.05, 
    sepia: 0, 
    warmth: 0, 
    sharpenAmount: 0.1,
    vignette: 0.1,
    upscale: false 
  };

  // الكشف التلقائي عن نية رفع الدقة من التعليمات
  const isUpscaleRequested = instruction.toLowerCase().includes('auto') || 
                             instruction.toLowerCase().includes('upscale') ||
                             instruction.toLowerCase().includes('resolution') ||
                             instruction.toLowerCase().includes('detail');

  try {
    const cleanImage = cleanBase64Data(base64Image);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanImage } },
          { text: `Photo Retouching task. Goal: "${instruction}". 
            Output VALID JSON ONLY.
            Constraints:
            - brightness: 0.9 to 1.15
            - contrast: 0.95 to 1.15
            - saturation: 0.9 to 1.25
            - sharpenAmount: 0.0 to 0.5 (Higher if requesting clarity/upscale)
            
            JSON Format:
            { "brightness": number, "contrast": number, "saturation": number, "sepia": number, "warmth": number, "sharpenAmount": number, "vignette": number }` 
          }
        ]
      }],
      config: { 
        responseMimeType: "application/json",
        safetySettings: SAFETY_SETTINGS,
      }
    });

    const p = JSON.parse(response.text || "{}");
    return {
      brightness: Number(p.brightness) || safeDefaults.brightness,
      contrast: Number(p.contrast) || safeDefaults.contrast,
      saturation: Number(p.saturation) || safeDefaults.saturation,
      sepia: Number(p.sepia) || safeDefaults.sepia,
      warmth: Number(p.warmth) || safeDefaults.warmth,
      sharpenAmount: Math.min(Number(p.sharpenAmount) || safeDefaults.sharpenAmount, 0.8), // زيادة الحد المسموح للحدة
      vignette: Number(p.vignette) || safeDefaults.vignette,
      upscale: isUpscaleRequested // تفعيل رفع الدقة
    };
  } catch (e) {
    console.error("Gemini API Failed, using defaults. Error:", e);
    // إذا فشل الـ API وكان الطلب رفع دقة، نقوم بذلك افتراضياً
    return { ...safeDefaults, upscale: isUpscaleRequested };
  }
};

const applyFiltersLocally = (base64Image: string, params: ImageAdjustments): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        
        // منطق رفع الدقة: إذا تم طلب Upscale، نضاعف أبعاد الكانفاس
        const scaleFactor = params.upscale ? 2 : 1;
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { reject(new Error("Canvas API unsupported")); return; }

        // تفعيل خوارزميات التنعيم عالية الجودة (Bicubic approximation)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. رسم الصورة (مكبرة أو بالحجم الأصلي)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. تطبيق التعديلات اللونية
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';

        tempCtx.filter = `brightness(${params.brightness}) contrast(${params.contrast}) saturate(${params.saturation}) sepia(${params.sepia})`;
        tempCtx.drawImage(canvas, 0, 0);
        
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);

        // 3. التوضيح (Sharpening) - تم تحسين الخوارزمية للتعامل مع الصور المكبرة
        // إذا تم التكبير، نزيد قوة التوضيح لتعويض نعومة الـ Upscale
        const effectiveSharpen = params.upscale ? Math.max(params.sharpenAmount, 0.3) : params.sharpenAmount;
        
        if (effectiveSharpen > 0.05) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // استخدام Blur أقل للصورة المكبرة لحفظ التفاصيل الدقيقة
            tempCtx.filter = params.upscale ? 'blur(2px)' : 'blur(1px)';
            tempCtx.drawImage(canvas, 0, 0);
            const blurredData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
            
            const data = imageData.data;
            const blur = blurredData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i] + (data[i] - blur[i]) * effectiveSharpen;
                const g = data[i+1] + (data[i+1] - blur[i+1]) * effectiveSharpen;
                const b = data[i+2] + (data[i+2] - blur[i+2]) * effectiveSharpen;
                
                data[i] = Math.max(0, Math.min(255, r));
                data[i+1] = Math.max(0, Math.min(255, g));
                data[i+2] = Math.max(0, Math.min(255, b));
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // 4. تلوين الجو العام
        if (params.warmth !== 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'soft-light';
            ctx.fillStyle = params.warmth > 0 
                ? `rgba(255, 160, 60, ${Math.min(Math.abs(params.warmth) / 100, 0.3)})` 
                : `rgba(60, 160, 255, ${Math.min(Math.abs(params.warmth) / 100, 0.3)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        // 5. Vignette
        if (params.vignette > 0) {
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, canvas.width * 0.6,
                canvas.width / 2, canvas.height / 2, canvas.width * 1.2
            );
            gradient.addColorStop(0, "rgba(0,0,0,0)");
            gradient.addColorStop(1, `rgba(0,0,0,${Math.min(params.vignette, 0.5)})`);
            
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        // تصدير بجودة عالية جداً
        resolve(canvas.toDataURL('image/jpeg', 0.98));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("فشل تحميل الصورة"));
    img.src = base64Image;
  });
};

export const remixImageWithGemini = async (highResImage: string, instruction: string, lowResHint?: string): Promise<string> => {
  const imageForAnalysis = lowResHint || highResImage;
  const params = await getEnhancementParameters(imageForAnalysis, instruction);
  return await applyFiltersLocally(highResImage, params);
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: `Original: "${originalDescription}". Instruction: "${userInstruction}". Rewrite in Arabic.` }] }],
      config: { safetySettings: SAFETY_SETTINGS }
    });
    return response.text || originalDescription;
  } catch (error) { return originalDescription; }
};

export const chatWithGemini = async (history: any[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: { 
        systemInstruction: "You are Lumina, a helpful Arabic design assistant.",
        safetySettings: SAFETY_SETTINGS
      }
    });
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) { return "عذراً، الخدمة مشغولة حالياً."; }
};
