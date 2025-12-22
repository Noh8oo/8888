
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { ImageAnalysis } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

// دالة تنظيف صارمة لضمان قبول الصورة
const cleanBase64Data = (base64: string): string => {
  // إزالة أي بادئة data uri باستخدام replace لضمان النص النظيف فقط
  return base64.replace(/^data:image\/\w+;base64,/, '');
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
  if (sizeInMB > 9) {
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } }, 
          // Ensure the prompt explicitly asks for generation to avoid text-only descriptions
          { text: `Generate a new image based on this input. ${stylePrompt}` },
        ],
      },
      config: { 
        safetySettings: SAFETY_SETTINGS,
        // Removed responseModalities to avoid potential conflicts with model defaults or refusals
      }
    });

    // استخراج الصورة من الاستجابة
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
    
    // If we have text but no image, it's likely a refusal or description
    if (textResponse.trim()) {
      console.warn("Model returned text instead of image:", textResponse);
      // Throwing this allows the UI to catch it, though we might want to map it to a generic error if it's just chatter
      // But usually it's a safety refusal or capability refusal
      throw new Error(`NO_IMAGE_RETURNED: ${textResponse.substring(0, 100)}`);
    }
    
    throw new Error("NO_IMAGE_RETURNED");

  } catch (e: any) {
    console.warn("Remix Error:", e.message);
    if (e.message.includes("413")) throw new Error("ERROR_IMAGE_TOO_LARGE");
    if (e.message.includes("429")) throw new Error("ERROR_QUOTA_EXCEEDED");
    if (e.message.includes("API_KEY")) throw new Error("ERROR_API_KEY_MISSING");
    if (e.message.includes("not found") || e.message.includes("404")) throw new Error("ERROR_MODEL_NOT_FOUND");
    if (e.message.includes("SAFETY")) throw new Error("ERROR_SAFETY_BLOCK");
    
    // Propagate the specific refusal text if we caught it above
    if (e.message.includes("NO_IMAGE_RETURNED")) throw e;

    throw new Error(`ERROR_GENERATION_FAILED: ${e.message}`);
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
