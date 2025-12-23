
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

// طريقة أكثر أماناً لاستخراج بيانات الصورة بغض النظر عن تنسيق المتصفح
const cleanBase64Data = (base64: string): string => {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

const validateApiKey = () => {
  const key = process.env.API_KEY;
  // تخفيف القيود على التحقق من المفتاح لتجنب الأخطاء في بيئات معينة
  if (!key || key.trim() === '' || key === 'undefined') {
    console.error("API Key Check Failed: Key is missing.");
    throw new Error("ERROR_API_KEY_MISSING");
  }
};

const checkPayloadSize = (base64: string) => {
  const sizeInBytes = (base64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  // رفع الحد قليلاً لضمان قبول الصور الكبيرة التي كانت تعمل سابقاً
  if (sizeInMB > 12) {
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

const handleApiError = (e: any) => {
  console.error("Gemini API Error:", e);
  
  if (e instanceof TypeError && e.message.includes("fetch")) {
    throw new Error("ERROR_NETWORK_FETCH");
  }
  if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
    throw new Error("ERROR_NETWORK_FETCH");
  }

  if (e.message?.includes("API_KEY") || e.message?.includes("403")) throw new Error("ERROR_API_KEY_MISSING");
  if (e.message?.includes("413") || e.message?.includes("Too Large")) throw new Error("ERROR_IMAGE_TOO_LARGE");
  if (e.message?.includes("429") || e.message?.includes("Quota")) throw new Error("ERROR_QUOTA_EXCEEDED");
  if (e.message?.includes("not found") || e.message?.includes("404")) throw new Error("ERROR_MODEL_NOT_FOUND");
  if (e.message?.includes("SAFETY") || e.message?.includes("BLOCKED")) throw new Error("ERROR_SAFETY_BLOCK");
  
  if (e.message?.includes("NO_IMAGE_RETURNED") || e.message?.includes("EMPTY_RESPONSE")) throw e;

  throw new Error(`ERROR_GENERATION_FAILED: ${e.message}`);
};

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  validateApiKey();
  const cleanBase64 = cleanBase64Data(base64Image);
  checkPayloadSize(cleanBase64);
  
  const mimeType = getMimeType(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // العودة إلى الإعدادات المرنة بدون Schema صارم لتجنب الأخطاء
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
        // تمت إزالة responseSchema للسماح للنموذج بالعمل بحرية كما كان سابقاً
      },
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    
    // تنظيف النص بشكل يدوي لضمان قبول JSON حتى لو كان فيه شوائب
    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as ImageAnalysis;
  } catch (e: any) {
    handleApiError(e);
    throw e;
  }
};

export const remixImageWithGemini = async (base64Image: string, stylePrompt: string): Promise<string> => {
  validateApiKey();
  
  const cleanBase64 = cleanBase64Data(base64Image);
  checkPayloadSize(cleanBase64); 
  
  const mimeType = getMimeType(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } }, 
          { text: `Generate a new image based on this input. ${stylePrompt}` },
        ],
      },
      config: { 
        safetySettings: SAFETY_SETTINGS,
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    let textResponse = "";

    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
        if (part.text) {
          textResponse += part.text + " ";
        }
      }
    }
    
    if (textResponse.trim()) {
      console.warn("Model returned text instead of image:", textResponse);
      throw new Error(`NO_IMAGE_RETURNED: ${textResponse.substring(0, 100)}`);
    }
    
    throw new Error("NO_IMAGE_RETURNED");

  } catch (e: any) {
    handleApiError(e);
    throw e;
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Modify this: "${originalDescription}" based on: "${userInstruction}". Arabic only.`,
    });
    return response.text || originalDescription;
  } catch (e: any) {
    console.error("Refine Error", e);
    return originalDescription;
  }
};

export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history,
      config: { systemInstruction: "أنت مساعد لومينا. أجب بالعربية باختصار." }
    });
    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "";
  } catch (e: any) {
    console.error("Chat Error", e);
    throw e;
  }
};
