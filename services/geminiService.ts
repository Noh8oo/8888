
import { GoogleGenAI, Type } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const cleanBase64Data = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/, '');
};

const getAI = () => {
  // استخدام مفتاح البيئة مباشرة كما هو مطلوب
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing. Please ensure it is set in your environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // النموذج المجاني الأكثر استقراراً
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: "حلل الصورة واستخرج الألوان والنمط والعناصر والتخطيط وزاوية الكاميرا والوصف (Prompt) باللغة العربية بصيغة JSON." }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            style: { type: Type.STRING },
            layout: { type: Type.STRING },
            layoutDetail: { type: Type.STRING },
            view: { type: Type.STRING },
            viewDetail: { type: Type.STRING },
            objects: { type: Type.ARRAY, items: { type: Type.STRING } },
            prompt: { type: Type.STRING },
          },
          required: ["colors", "style", "layout", "layoutDetail", "view", "viewDetail", "objects", "prompt"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as ImageAnalysis;
  } catch (e: any) {
    console.error("Analysis Error:", e);
    throw new Error("فشل تحليل الصورة. تأكد من أن مفتاح API_KEY مضاف بشكل صحيح في إعدادات Vercel.");
  }
};

export const enhanceImageWithGemini = async (base64Image: string): Promise<string> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = getAI();

  try {
    // استخدام gemini-2.5-flash-image لمهام تعديل الصور المجانية
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: 'Enhance this image: upscale it, increase clarity, sharpen edges, and fix lighting while maintaining the exact same content. Return ONLY the enhanced image.' }
        ],
      },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data in response");
  } catch (e: any) {
    console.error("Enhancement Error:", e);
    throw new Error("فشل تحسين الصورة. قد يكون السبب حجم الصورة أو تجاوز حدود الاستخدام المجاني.");
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `عدل هذا الوصف: "${originalDescription}" بناءً على طلب المستخدم: "${userInstruction}". أجب بالوصف الجديد فقط باللغة العربية.`,
    });
    return response.text || originalDescription;
  } catch (e) {
    return originalDescription;
  }
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const ai = getAI();
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history,
      config: {
        systemInstruction: "أنت مساعد ذكي في لومينا، خبير في تحليل الصور والتصميم. أجب دائماً بالعربية وبأسلوب ودود ومفيد."
      }
    });
    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "";
  } catch (e) {
    return "عذراً، أواجه مشكلة في الرد حالياً.";
  }
};
