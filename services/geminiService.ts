
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
    throw new Error("المفتاح غير موجود في الإعدادات.");
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
      model: "gemini-3-flash-preview",
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

    if (!response.text) throw new Error("لم يتم استلام رد.");
    return JSON.parse(response.text) as ImageAnalysis;
  } catch (e: any) {
    console.error(e);
    if (e.message.includes("429")) throw new Error("تم الوصول لحد الاستهلاك المجاني. انتظر قليلاً وأعد المحاولة.");
    throw new Error("فشل التحليل. يرجى تجربة صورة أخرى أو التحقق من المفتاح.");
  }
};

export const enhanceImageWithGemini = async (base64Image: string): Promise<string> => {
  const apiKey = validateApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: 'Improve lighting and sharpness of this image.' }
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("فشل التحسين.");
  } catch (e: any) {
    throw new Error("حدث خطأ أثناء معالجة الصورة. الخطة المجانية قد تكون مشغولة.");
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
    config: { systemInstruction: "أنت مساعد ذكي في لومينا. أجب بالعربية دائماً." }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};
