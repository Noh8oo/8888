
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
    throw new Error("ERROR_API_KEY_MISSING");
  }
};

const checkPayloadSize = (base64: string) => {
  const sizeInBytes = (base64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 4.5) {
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
    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as ImageAnalysis;
  } catch (e: any) {
    console.error("Analysis Error:", e);
    if (e.message.includes("API_KEY")) throw new Error("ERROR_API_KEY_MISSING");
    if (e.message.includes("413") || e.message.includes("Too Large")) throw new Error("ERROR_IMAGE_TOO_LARGE");
    if (e.message.includes("429") || e.message.includes("Quota")) throw new Error("ERROR_QUOTA_EXCEEDED");
    if (e.message.includes("Failed to fetch") || e.message.includes("Network")) throw new Error("ERROR_NETWORK");
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

  try {
    // استخدام الموديل المحدد gemini-2.5-flash-image للاتصال المباشر والسريع
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Equivalent to 2.5-flash-image-preview
      contents: {
        parts: [
          // Prompt first or image first works, but instruction first is often better for instructions
          { text: stylePrompt },
          { inlineData: { data: cleanBase64, mimeType } }
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
    
    // إذا لم ترجع صورة
    throw new Error("NO_IMAGE_RETURNED");

  } catch (e: any) {
    console.warn("Remix Error:", e.message);
    if (e.message.includes("413")) throw new Error("ERROR_IMAGE_TOO_LARGE");
    if (e.message.includes("429")) throw new Error("ERROR_QUOTA_EXCEEDED");
    if (e.message.includes("API_KEY")) throw new Error("ERROR_API_KEY_MISSING");
    throw new Error("ERROR_GENERATION_FAILED");
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
