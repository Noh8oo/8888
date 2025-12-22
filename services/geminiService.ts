
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  // Default to jpeg if extraction fails, matching Hero.tsx output
  return match ? match[1] : 'image/jpeg';
};

const cleanBase64Data = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/, '');
};

const validateApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key.trim() === '' || key === 'undefined') {
    console.error("API Key Check Failed: Key is missing.");
    throw new Error("ERROR_API_KEY_MISSING");
  }
};

const checkPayloadSize = (base64: string) => {
  // حساب تقريبي لحجم البايتات
  const sizeInBytes = (base64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // رفع الحد قليلاً ليكون 3.5MB لأننا نعتمد على ضغط Hero.tsx المسبق
  if (sizeInMB > 3.5) {
    throw new Error("ERROR_IMAGE_TOO_LARGE");
  }
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  validateApiKey();
  const cleanBase64 = cleanBase64Data(base64Image);
  checkPayloadSize(cleanBase64);
  
  const mimeType = getMimeType(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // استخدام gemini-2.5-flash لاستقرار أكبر مع JSON في الباقة المجانية
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: "Analyze this image. Return ONLY a valid JSON object with these keys: colors (array of hex strings), style (string), layout (string), layoutDetail (string), view (string), viewDetail (string), objects (array of strings), prompt (string). Do not include markdown code blocks." }
        ],
      },
      config: {
        responseMimeType: "application/json",
        // Schema helps, but 2.5-flash works well even with just mimeType
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
          required: ["colors", "style", "objects", "prompt"],
        },
      },
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    
    // محاولة تنظيف النص من علامات الماركداون إذا وجدت رغم التعليمات
    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText) as ImageAnalysis;

  } catch (e: any) {
    console.error("Analysis Error:", e);
    // تفصيل الأخطاء للواجهة
    if (e.message.includes("API_KEY")) throw new Error("ERROR_API_KEY_MISSING");
    if (e.message.includes("413") || e.message.includes("Too Large")) throw new Error("ERROR_IMAGE_TOO_LARGE");
    if (e.message.includes("429") || e.message.includes("Quota")) throw new Error("ERROR_QUOTA_EXCEEDED");
    if (e.message.includes("Failed to fetch") || e.message.includes("Network")) throw new Error("ERROR_NETWORK");
    
    // إذا فشل تحليل JSON
    if (e instanceof SyntaxError) throw new Error("ERROR_GENERATION_FAILED");
    
    throw new Error(`ERROR_ANALYSIS_FAILED: ${e.message}`);
  }
};

export const remixImageWithGemini = async (base64Image: string, stylePrompt: string): Promise<string> => {
  validateApiKey();
  const cleanBase64 = cleanBase64Data(base64Image);
  checkPayloadSize(cleanBase64); 
  
  const mimeType = getMimeType(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. المحاولة الأولى: Img2Img باستخدام Nano Banana (2.5 flash image)
  try {
    console.log("Attempt 1: Direct Remix (Img2Img)");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: `Transform this image into style: ${stylePrompt}. High quality.` }
        ],
      },
      config: { safetySettings: SAFETY_SETTINGS }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (e: any) {
    console.warn("Attempt 1 Error:", e.message);
    if (e.message.includes("429")) throw new Error("ERROR_QUOTA_EXCEEDED");
  }

  // 2. المحاولة الثانية: استخراج الوصف ثم التوليد (Text-to-Image)
  try {
    console.log("Attempt 2: Describe then Generate");
    const descResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: "Describe this image in detail." }
        ]
      }
    });
    
    const description = descResponse.text || "A creative image";
    
    const genResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Create image: ${description}. Style: ${stylePrompt}. High resolution.` }
        ],
      },
      config: { safetySettings: SAFETY_SETTINGS }
    });

    const genParts = genResponse.candidates?.[0]?.content?.parts;
    if (genParts) {
      for (const part of genParts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (err: any) {
    console.error("Attempt 2 Error:", err);
    if (err.message.includes("429")) throw new Error("ERROR_QUOTA_EXCEEDED");
  }

  throw new Error("ERROR_GENERATION_FAILED");
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
