import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const cleanBase64Data = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/, '');
};

// إعدادات أمان متساهلة للسماح بمعالجة الصور الفنية
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  // Guideline: Always use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: "Analyze image and provide output as JSON with: colors (HEX), style, objects, and an Arabic prompt." }
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

    if (!response.text) throw new Error("EMPTY");
    return JSON.parse(response.text) as ImageAnalysis;
  } catch (e: any) {
    console.error("Analysis Error:", e);
    throw new Error("فشل تحليل الصورة. تأكد من المفتاح أو حاول صورة أخرى.");
  }
};

export const remixImageWithGemini = async (base64Image: string, stylePrompt: string): Promise<string> => {
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // المحاولة الأولى: تعديل الصورة مباشرة (Image-to-Image)
    console.log("Attempting direct remix...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: `Transform this image strictly into this style: ${stylePrompt}. Keep the main subject but redraw everything in high quality.` }
        ],
      },
      config: {
        safetySettings: SAFETY_SETTINGS, // ضروري جداً لتجنب الحظر الفوري
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
    throw new Error("No image returned from direct remix");

  } catch (e: any) {
    console.warn("Direct remix failed, attempting fallback (Text-to-Image)...", e);
    
    // الخطة البديلة (Fallback):
    // إذا فشل التعديل (بسبب 400 Bad Request أو فلاتر)، نقوم بتوليد صورة جديدة من الصفر
    // باستخدام وصف الصورة + النمط. هذا يضمن نتيجة دائماً.
    
    try {
      // 1. استخراج وصف سريع للصورة إذا لم يكن التعديل المباشر متاحاً
      const descResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: "Describe the main subject and composition of this image in English briefly." }
          ]
        }
      });
      
      const imgDescription = descResponse.text || "A creative composition";
      
      // 2. توليد صورة جديدة تماماً بناءً على الوصف + النمط
      // نستخدم gemini-2.5-flash-image كمولد صور
      const genResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `Generate an image: ${imgDescription}. Style: ${stylePrompt}. High quality, 4k.` }
          ],
        },
        config: {
          safetySettings: SAFETY_SETTINGS,
        }
      });

      const genParts = genResponse.candidates?.[0]?.content?.parts;
      if (genParts) {
        for (const part of genParts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (fallbackError: any) {
      console.error("Fallback failed:", fallbackError);
      throw new Error(`فشلت المعالجة: ${e.message}`);
    }
    
    throw new Error("تعذر إنشاء الصورة. يرجى المحاولة لاحقاً.");
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Modify this: "${originalDescription}" based on: "${userInstruction}". Arabic only.`,
  });
  return response.text || originalDescription;
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history,
    config: { systemInstruction: "أنت مساعد لومينا. أجب بالعربية باختصار." }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};