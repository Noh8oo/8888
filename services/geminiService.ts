
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
  // استخدام المفتاح الموجود في البيئة حصراً
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // نموذج مجاني وسريع
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

  try {
    return JSON.parse(response.text || "{}") as ImageAnalysis;
  } catch (e) {
    throw new Error("فشل تحليل البيانات، يرجى المحاولة مرة أخرى.");
  }
};

export const enhanceImageWithGemini = async (base64Image: string): Promise<string> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = getAI();

  // استخدام النموذج المجاني المخصص للصور gemini-2.5-flash-image
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: cleanBase64, mimeType } },
        { text: 'Improve this image: upscale it slightly, sharpen the details, fix the lighting, and remove digital noise while keeping it identical to the original. Return only the enhanced image data.' }
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

  throw new Error("لم نتمكن من تحسين الصورة حالياً، جرب صورة أخرى.");
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `عدل هذا الوصف: "${originalDescription}" بناءً على طلب المستخدم: "${userInstruction}". أجب بالوصف الجديد فقط باللغة العربية.`,
  });
  return response.text || originalDescription;
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history,
    config: {
      systemInstruction: "أنت مساعد ذكي في لومينا، خبير في تحليل الصور والتصميم. أجب دائماً بالعربية وبأسلوب ودود ومفيد."
    }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};
