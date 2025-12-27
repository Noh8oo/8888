
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const cleanBase64Data = (base64: string): string => {
  return base64.includes(',') ? base64.split(',')[1] : base64;
};

const validateApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key.trim() === '' || key === 'undefined') {
    throw new Error("ERROR_API_KEY_MISSING");
  }
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const handleApiError = (e: any) => {
  console.error("Gemini API Error Details:", e);
  const msg = e.message || "";
  if (msg.includes("fetch")) throw new Error("ERROR_NETWORK_FETCH");
  if (msg.includes("403")) throw new Error("ERROR_API_KEY_MISSING");
  if (msg.includes("413")) throw new Error("ERROR_IMAGE_TOO_LARGE");
  if (msg.includes("429")) throw new Error("ERROR_QUOTA_EXCEEDED");
  if (msg.includes("SAFETY")) throw new Error("ERROR_SAFETY_BLOCK");
  throw new Error(`ERROR_GENERATION_FAILED: ${msg}`);
};

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  validateApiKey();
  const cleanBase64 = cleanBase64Data(base64Image);
  const mimeType = getMimeType(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      // Updated to gemini-3-flash-preview for multi-modal analysis tasks
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: "Analyze this image and return a JSON object with: colors (hex array), style (string), layout (string), layoutDetail (string), view (string), viewDetail (string), objects (array), prompt (detailed English prompt for recreating this image). Return ONLY raw JSON." }
        ],
      },
      config: { responseMimeType: "application/json" },
    });

    const text = response.text || "{}";
    // تنظيف النص من أي علامات Markdown قد يضيفها النموذج تلقائياً
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString) as ImageAnalysis;
  } catch (e: any) {
    handleApiError(e);
    throw e;
  }
};

export const remixImageWithGemini = async (base64Image: string, stylePrompt: string): Promise<string> => {
  validateApiKey();
  const cleanBase64 = cleanBase64Data(base64Image);
  const mimeType = getMimeType(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } }, 
          { text: stylePrompt },
        ],
      },
      config: { safetySettings: SAFETY_SETTINGS }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
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
      contents: `Improve this description: "${originalDescription}" based on: "${userInstruction}". Keep it in Arabic.`,
    });
    return response.text || originalDescription;
  } catch (e: any) {
    return originalDescription;
  }
};

// Fix: Add missing chatWithGemini export for the ChatWidget component
export const chatWithGemini = async (history: any[], message: string): Promise<string> => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const contents = [...history, { role: 'user', parts: [{ text: message }] }];
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: "أنت مساعد تصميم محترف في مختبر لومينا. تساعد المستخدمين في تحليل الصور وتقديم أفكار إبداعية وتوضيح مفاهيم التصميم. اجعل ردودك مفيدة، ملهمة، ومختصرة وباللغة العربية.",
      }
    });
    return response.text || "";
  } catch (e: any) {
    handleApiError(e);
    throw e;
  }
};
