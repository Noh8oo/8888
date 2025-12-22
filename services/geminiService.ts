
import { GoogleGenAI, Type } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const cleanBase64Data = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/, '');
};

const validateApiKey = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
    throw new Error("API_KEY_MISSING");
  }

  if (apiKey.startsWith('gsk_')) {
    throw new Error("API_KEY_GROQ_MISMATCH");
  }

  return apiKey;
};

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  const apiKey = validateApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // النموذج الأنسب والأسرع للخطة المجانية
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: "حلل الصورة واستخرج: الألوان، النمط، العناصر، التخطيط، والوصف (Prompt) بالعربية بصيغة JSON." }
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

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    return JSON.parse(response.text) as ImageAnalysis;
  } catch (e: any) {
    if (e.message.includes("429")) throw new Error("الخطة المجانية وصلت للحد الأقصى حالياً، انتظر دقيقة وأعد المحاولة.");
    if (["API_KEY_MISSING", "API_KEY_GROQ_MISMATCH"].includes(e.message)) throw e;
    throw new Error("حدث خطأ في معالجة الصورة. يرجى تجربة صورة أصغر أو التحقق من جودة الاتصال.");
  }
};

export const enhanceImageWithGemini = async (base64Image: string): Promise<string> => {
  const apiKey = validateApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // نموذج تعديل الصور السريع
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: 'Enhance this photo: improve lighting and sharpness.' }
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("FAILED_ENHANCEMENT");
  } catch (e: any) {
    if (e.message.includes("429")) throw new Error("الخطة المجانية مشغولة حالياً، يرجى المحاولة بعد قليل.");
    throw new Error("لم نتمكن من تحسين الصورة. قد يكون السبب حجم الملف أو قيود الخطة المجانية.");
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  const apiKey = validateApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `عدل الوصف: "${originalDescription}" بناءً على: "${userInstruction}". أجب بالعربية فقط.`,
  });
  return response.text || originalDescription;
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const apiKey = validateApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history,
    config: { systemInstruction: "أنت مساعد ذكي خبير تصميم. أجب بالعربية باختصار وود." }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};
