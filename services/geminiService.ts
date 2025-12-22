
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const cleanBase64Data = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/, '');
};

const validateApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key.trim() === '' || key === 'undefined') {
    console.error("API Key Check Failed: Key is missing.");
    throw new Error("API_KEY_MISSING");
  }
};

// إعدادات أمان قصوى للسماح بتوليد الصور
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  validateApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
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
    if (e.message === "API_KEY_MISSING") throw e;
    throw new Error("فشل تحليل الصورة. حاول مرة أخرى.");
  }
};

export const remixImageWithGemini = async (base64Image: string, stylePrompt: string): Promise<string> => {
  validateApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. المحاولة الأولى: تعديل الصورة المباشر (Image-to-Image)
  try {
    console.log("Starting Direct Remix (Img2Img)...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: `Create a high-quality version of this image in this style: ${stylePrompt}. Maintain the composition but change the artistic style entirely.` }
        ],
      },
      config: {
        safetySettings: SAFETY_SETTINGS,
      }
    });

    // التحقق من وجود صورة في الرد
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // إذا وصلنا هنا، فالنموذج رد ولكن بدون صورة (غالباً فلتر أمان صامت)
    console.warn("Direct Remix returned text only or blocked content. Switching to Fallback.");
  } catch (e: any) {
    console.warn("Direct Remix failed with error:", e.message);
    // ننتقل للخطة البديلة
  }

  // 2. الخطة البديلة: توليد صورة من الصفر (Text-to-Image)
  // هذه الطريقة أكثر ضماناً لأنها تتجاوز قيود "الصورة الأصلية"
  try {
    console.log("Starting Fallback (Text2Img)...");
    
    // أ. استخراج وصف للصورة الأصلية أولاً
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: "Describe the main subject, colors, and composition of this image in one English sentence." }
        ]
      }
    });
    
    const description = analysisResponse.text || "A creative scene";
    console.log("Fallback Description:", description);

    // ب. توليد صورة جديدة بناءً على الوصف + النمط
    const genResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Generate a high-quality image: ${description}. Art Style: ${stylePrompt}. Ensure high resolution and detail.` }
        ],
      },
      config: {
        safetySettings: SAFETY_SETTINGS,
      }
    });

    const genParts = genResponse.candidates?.[0]?.content?.parts;
    if (genParts) {
      for (const part of genParts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated in fallback.");

  } catch (fallbackError: any) {
    console.error("All remix attempts failed:", fallbackError);
    if (fallbackError.message?.includes("SAFETY")) {
      throw new Error("REJECTED_SAFETY");
    }
    throw new Error(`FAILED_GENERATION: ${fallbackError.message}`);
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Modify this: "${originalDescription}" based on: "${userInstruction}". Arabic only.`,
  });
  return response.text || originalDescription;
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history,
    config: { systemInstruction: "أنت مساعد لومينا. أجب بالعربية باختصار." }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};
