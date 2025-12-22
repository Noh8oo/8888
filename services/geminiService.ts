
import { GoogleGenAI, Type } from "@google/genai";
import { ImageAnalysis } from "../types";

// Always initialize a new instance within the function to ensure up-to-date API keys and configurations.
export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  // Using a fresh instance for each request as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
        {
          text: `قم بتحليل هذه الصورة وقدم مخرجات منظمة بصيغة JSON.
          استخرج 5 ألوان مهيمنة (رموز hex).
          صف النمط الفني (مثلاً: حديث بسيط، كلاسيكي، إلخ) باللغة العربية.
          حدد نوع التكوين/التخطيط (مثلاً: قاعدة الأثلاث) وقدم شرحاً تفصيلياً عنه باللغة العربية.
          حدد زاوية الكاميرا (مثلاً: منظر أمامي) وقدم شرحاً تفصيلياً عنها باللغة العربية.
          استخرج قائمة بأهم العناصر والكائنات (Objects) الظاهرة في الصورة باللغة العربية.
          اكتب وصفاً نصياً دقيقاً (Prompt) باللغة العربية يمكن استخدامه لإعادة إنشاء هذه الصورة باستخدام الذكاء الاصطناعي.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          colors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          style: { type: Type.STRING },
          layout: { type: Type.STRING },
          layoutDetail: { type: Type.STRING },
          view: { type: Type.STRING },
          viewDetail: { type: Type.STRING },
          objects: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }
          },
          prompt: { type: Type.STRING },
        },
        required: ["colors", "style", "layout", "layoutDetail", "view", "viewDetail", "objects", "prompt"],
      },
    },
  });

  const jsonText = response.text || "{}";
  try {
    return JSON.parse(jsonText) as ImageAnalysis;
  } catch (e) {
    throw new Error("Analysis failed");
  }
};

export const enhanceImageWithGemini = async (base64Image: string): Promise<string> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  // Using a fresh instance for each request as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        },
        {
          text: 'Super-resolve and professionally enhance this image. Remove noise, sharpen edges, recover lost textures, and increase overall clarity significantly. Output a high-fidelity, professional version while strictly maintaining the original colors, content, and geometry.',
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

  throw new Error("No image was returned");
};

export const transformImageWithGemini = async (base64Image: string, styleInstruction: string): Promise<string> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  // Using a fresh instance for each request as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        },
        {
          text: `Transform this image into the following style: ${styleInstruction}. Maintain the overall composition and recognizable subjects but completely change the artistic rendering to fit the requested style. High quality output.`,
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

  throw new Error("Transformation failed");
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  try {
    // Using a fresh instance for each request as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `لديك وصف لصورة: "${originalDescription}". المطلوب: تعديله بناءً على: "${userInstruction}". أجب بالنص الجديد فقط.`,
    });
    return response.text || originalDescription;
  } catch (error) {
    throw error;
  }
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  // Using a fresh instance for each request as per guidelines.
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
