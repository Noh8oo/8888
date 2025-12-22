
import { GoogleGenAI, Type } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const cleanBase64Data = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/, '');
};

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  
  // إنشاء مثيل جديد في كل مرة لضمان استقرار المفتاح على Vercel
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    if (!response.text) throw new Error("لم يتم استلام نص من الذكاء الاصطناعي.");
    return JSON.parse(response.text) as ImageAnalysis;
  } catch (e: any) {
    console.error("Analysis Error Details:", e);
    throw new Error(e.message?.includes('403') || e.message?.includes('401') 
      ? "خطأ في مفتاح الـ API. يرجى التأكد من إضافة API_KEY صحيح في Vercel." 
      : "فشل تحليل الصورة. يرجى المحاولة مرة أخرى.");
  }
};

export const enhanceImageWithGemini = async (base64Image: string): Promise<string> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: 'Improve this photo: upscale quality, enhance details, sharpen edges, and fix the lighting. Keep the image exactly the same but clearer. Return the updated image part.' }
        ],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("لم يقم المحرك بإرجاع أي بيانات.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("لم نتمكن من العثور على الصورة المحسنة في الرد.");
  } catch (e: any) {
    console.error("Enhancement Error Details:", e);
    throw new Error(e.message?.includes('403') 
      ? "تجاوزت حدود الاستخدام المجاني أو المفتاح غير صالح." 
      : "حدث خطأ أثناء معالجة الصورة. يرجى تجربة صورة أصغر.");
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `عدل هذا الوصف: "${originalDescription}" بناءً على: "${userInstruction}". أجب بالوصف الجديد فقط بالعربية.`,
  });
  return response.text || originalDescription;
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history,
    config: {
      systemInstruction: "أنت مساعد ذكي في لومينا. خبير في التصميم. أجب دائماً بالعربية وبأسلوب ودود."
    }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};
