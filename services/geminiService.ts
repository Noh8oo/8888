
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
          { text: "Analyze image: colors (HEX), style, objects, and a detailed prompt in Arabic. Output as JSON." }
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
    console.error("Analysis Error:", e);
    throw new Error("فشل في تحليل الصورة. يرجى المحاولة مرة أخرى.");
  }
};

export const enhanceImageWithGemini = async (base64Image: string): Promise<string> => {
  const apiKey = validateApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey });

  try {
    // استخدام نموذج gemini-2.5-flash-image لأنه الأسرع والأكثر استقراراً في المهام البسيطة
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: 'enhance image' } // أمر بسيط جداً لتجنب أي تعقيدات أو فلاتر أمان
        ],
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("NO_IMAGE_RETURNED");
  } catch (e: any) {
    console.error("Enhance Error Details:", e);
    // رسالة خطأ ذكية للمستخدم
    if (e.message?.includes("504") || e.message?.includes("fetch")) {
      throw new Error("تأخر الرد من الخادم (Vercel Timeout). جرب صورة أصغر.");
    }
    throw new Error("نموذج التحسين غير مدعوم حالياً في منطقتك الجغرافية على Vercel.");
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  const apiKey = validateApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Modify description: "${originalDescription}" based on: "${userInstruction}". Arabic output only.`,
  });
  return response.text || originalDescription;
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const apiKey = validateApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history,
    config: { systemInstruction: "أنت مساعد لومينا، خبير تصميم. أجب بالعربية دائماً." }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};
