
import { GoogleGenAI } from "@google/genai";
import { ImageAnalysis } from "../types";

// تهيئة العميل باستخدام المفتاح من البيئة
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// استخدام الموديل المستقر والسريع لتفادي مشاكل الحصة (429 Resource Exhausted)
const MODEL_NAME = 'gemini-1.5-flash';

// تنظيف سلسلة Base64
const cleanBase64Data = (base64: string): string => {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

// ---------------------------------------------------------
// خدمة التحليل (Analysis)
// ---------------------------------------------------------

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  try {
    const cleanImage = cleanBase64Data(base64Image);

    // نطلب من الموديل إرجاع JSON بشكل صارم
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanImage
              }
            },
            {
              text: `Analyze this image precisely. Return a VALID JSON object (no markdown) with these exact keys:
              {
                "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
                "style": "art style (in Arabic)",
                "layout": "composition summary (in Arabic)",
                "layoutDetail": "technical details about balance and framing (in Arabic)",
                "view": "camera angle (in Arabic)",
                "viewDetail": "detailed angle description (in Arabic)",
                "objects": ["obj1", "obj2"] (in Arabic),
                "prompt": "Highly detailed description for image generation (in Arabic)"
              }`
            }
          ]
        }
      ],
      config: {
        temperature: 0.4,
        responseMimeType: "application/json" // ضمان الحصول على JSON
      }
    });

    const text = response.text || "{}";
    // تنظيف النص في حال وصل معه Markdown
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString) as ImageAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // إرجاع بيانات افتراضية في حال الفشل لتجنب تحطم التطبيق
    return {
      colors: ["#cccccc", "#888888"],
      style: "غير محدد",
      layout: "تحليل عام",
      view: "واجهة أمامية",
      objects: ["عنصر غير معروف"],
      prompt: "عذراً، واجهنا مشكلة في الاتصال بالخدمة لتحليل الصورة. يرجى المحاولة لاحقاً."
    };
  }
};

// ---------------------------------------------------------
// خدمة التحسين الهجين (AI Parameters + Local Canvas)
// ---------------------------------------------------------

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  warmth: number;
}

// دالة مساعدة للحصول على إعدادات الفلتر من الذكاء الاصطناعي
const getEnhancementParameters = async (base64Image: string, instruction: string): Promise<ImageAdjustments> => {
  try {
    const cleanImage = cleanBase64Data(base64Image);
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanImage } },
            { 
              text: `Act as a professional photo editor. based on the image content and this goal: "${instruction}", return a JSON object with numeric adjustments:
              {
                "brightness": 0.5 to 1.5 (default 1.0),
                "contrast": 0.5 to 1.5 (default 1.0),
                "saturation": 0.0 to 2.0 (default 1.0),
                "sepia": 0.0 to 1.0 (default 0),
                "warmth": -50 (blue) to 50 (orange) (default 0)
              }`
            }
          ]
        }
      ],
      config: { responseMimeType: "application/json" }
    });

    const params = JSON.parse(response.text || "{}");
    return {
      brightness: Number(params.brightness) || 1,
      contrast: Number(params.contrast) || 1,
      saturation: Number(params.saturation) || 1,
      sepia: Number(params.sepia) || 0,
      warmth: Number(params.warmth) || 0
    };

  } catch (e) {
    console.warn("AI param fallback used");
    // إعدادات افتراضية في حال فشل الاتصال
    return { brightness: 1.1, contrast: 1.1, saturation: 1.1, sepia: 0, warmth: 0 };
  }
};

// دالة تطبيق الفلاتر محلياً (لا تستهلك حصة API للصور)
const applyFiltersLocally = (base64Image: string, params: ImageAdjustments): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error("Canvas not supported")); return; }

      // 1. رسم الصورة الأصلية
      ctx.drawImage(img, 0, 0);

      // 2. تطبيق فلاتر CSS الأساسية
      const filterString = `brightness(${params.brightness}) contrast(${params.contrast}) saturate(${params.saturation}) sepia(${params.sepia})`;
      ctx.filter = filterString;
      
      // إعادة الرسم لتطبيق الفلتر
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none'; // إعادة تعيين الفلتر

      // 3. تطبيق طبقة الدفء/البرودة (Overlay)
      if (params.warmth !== 0) {
        ctx.globalCompositeOperation = 'overlay';
        if (params.warmth > 0) {
           // دافئ (برتقالي)
           ctx.fillStyle = `rgba(255, 160, 0, ${Math.min(Math.abs(params.warmth) / 100, 0.4)})`;
        } else {
           // بارد (أزرق)
           ctx.fillStyle = `rgba(0, 100, 255, ${Math.min(Math.abs(params.warmth) / 100, 0.4)})`;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      resolve(canvas.toDataURL('image/jpeg', 0.90));
    };
    img.onerror = reject;
    img.src = base64Image;
  });
};

export const remixImageWithGemini = async (base64Image: string, instruction: string): Promise<string> => {
  // هذه الطريقة توفر الحصة بشكل كبير لأنها تستخدم نموذج النصوص فقط لاستخراج الأرقام
  // ثم تقوم بمعالجة الصورة في المتصفح
  const params = await getEnhancementParameters(base64Image, instruction);
  return await applyFiltersLocally(base64Image, params);
};

// ---------------------------------------------------------
// تحسين النصوص والدردشة
// ---------------------------------------------------------

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Original: "${originalDescription}". Instruction: "${userInstruction}". Rewrite the description in Arabic based on the instruction.` }]
        }
      ]
    });
    return response.text || originalDescription;
  } catch (error) {
    return originalDescription;
  }
};

export const chatWithGemini = async (history: any[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        systemInstruction: "You are a helpful design assistant named Lumina. You speak Arabic.",
      }
    });

    const result = await chat.sendMessage({ message: message });
    return result.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "عذراً، أواجه ضغطاً عالياً حالياً. يرجى المحاولة بعد قليل.";
  }
};
