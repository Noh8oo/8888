
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ImageAnalysis } from "../types";

// Helper helper to safely get the key
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key || key.trim() === '' || key.includes('VITE_API_KEY')) {
    console.error("API Key is missing or invalid in environment variables.");
    throw new Error("API_KEY_MISSING");
  }
  return key;
};

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const cleanBase64Data = (base64: string): string => {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  const key = getApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: key });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: "Analyze this image. Return a valid JSON object with these exact keys: colors (array of hex strings), style (string), layout (string), layoutDetail (detailed string), view (string), viewDetail (detailed string), objects (array of strings), prompt (string describing the image for generation). Do not use markdown formatting." }
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
          required: ["colors", "style", "layout", "objects", "prompt"],
        },
      },
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as ImageAnalysis;
  } catch (e: any) {
    console.error("Analysis Error:", e);
    throw e;
  }
};

export const remixImageWithGemini = async (base64Image: string, enhancementInstruction: string): Promise<string> => {
  const key = getApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: key });

  let lastError: any = null;

  // We are now strictly doing IMAGE ENHANCEMENT/UPSCALING.
  // Strategy: Use Gemini 2.5 Flash Image which supports Image Input -> Image Output.
  // We prompt it to maintain the content but improve quality.
  
  try {
    console.log("Attempting Enhancement via Gemini 2.5 Img2Img");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: `Strictly maintain the original image content, composition, and colors. Your ONLY task is to enhance the image quality based on this instruction: ${enhancementInstruction}. Output the result as a high-quality image.` }
        ],
      },
      config: { 
        safetySettings: SAFETY_SETTINGS 
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    console.warn("Enhancement result contained no image data.");
  } catch (e: any) {
    console.warn("Enhancement Failed:", e.message);
    lastError = e;
  }

  // NOTE: We removed the "Imagen 3" fallback because Imagen generates NEW images from text,
  // which violates the user's requirement to only "Enhance" the existing pixels.
  // If Gemini 2.5 fails to return an image, we must fail gracefully rather than returning a fake generated image.

  if (lastError) {
    throw lastError;
  }

  throw new Error("FAILED_GENERATION: Could not enhance image. Please try again.");
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  const key = getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Reword this description: "${originalDescription}" applying this instruction: "${userInstruction}". Keep it in Arabic.`,
    });
    return response.text || originalDescription;
  } catch (e) {
    return originalDescription;
  }
};

export const chatWithGemini = async (history: any[], message: string): Promise<string> => {
  const key = getApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: {
        systemInstruction: "أنت مساعد تصميم محترف في مختبر لومينا. تساعد المستخدمين في تحليل الصور وتقديم أفكار إبداعية وتوضيح مفاهيم التصميم. اجعل ردودك مفيدة، ملهمة، ومختصرة وباللغة العربية.",
      }
    });
    const response = await chat.sendMessage({ message });
    return response.text || "";
  } catch (e: any) {
    console.error("Chat Error:", e);
    return "عذراً، حدث خطأ في الاتصال.";
  }
};
