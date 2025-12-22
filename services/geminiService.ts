
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `قم بتحليل هذه الصورة وقدم مخرجات منظمة بصيغة JSON باللغة العربية. 
          استخرج 5 ألوان مهيمنة (hex). صف النمط الفني. حدد نوع التخطيط مع شرح. حدد زاوية الكاميرا مع شرح. استخرج العناصر. اكتب وصفاً نصياً (Prompt) دقيقاً.`,
        },
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
    throw new Error("فشل في تحليل البيانات المستلمة");
  }
};

export const enhanceImageWithGemini = async (base64Image: string): Promise<string> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
        {
          text: 'Super-resolve and professionally enhance this image. Remove noise, sharpen edges, recover lost textures, and increase overall clarity significantly. Output a high-fidelity, professional version while strictly maintaining the original colors and geometry.',
        },
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

  throw new Error("لم يتم إرجاع أي صورة من الخادم");
};

export const transformImageWithGemini = async (base64Image: string, styleInstruction: string): Promise<string> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
        {
          text: `Transform this image into the following style: ${styleInstruction}. Maintain composition but change rendering style.`,
        },
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

  throw new Error("فشلت عملية التحويل الفني");
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `لديك وصف لصورة: "${originalDescription}". المطلوب: تعديله بناءً على: "${userInstruction}". أجب بالنص الجديد فقط.`,
  });
  return response.text || originalDescription;
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history,
    config: {
      systemInstruction: "أنت مساعد ذكي متخصص في التصميم وتحليل الصور. أجب دائماً باللغة العربية وبأسلوب مهني وودود."
    }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};
