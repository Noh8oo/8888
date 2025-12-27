
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ImageAnalysis } from "../types";

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

const validateApiKey = () => {
  // In Vite, process.env.API_KEY is replaced by the defined string
  const key = process.env.API_KEY;
  if (!key || key.trim() === '' || key === 'undefined' || key.includes('VITE_API_KEY')) {
    console.error("API Key Check Failed: Key is missing or invalid.");
    throw new Error("API_KEY_MISSING");
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
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        // Strict schema helps ensure JSON validity
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
    
    // Sometimes the model might wrap in ```json ... ``` despite mimeType, so we clean it just in case
    const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as ImageAnalysis;
  } catch (e: any) {
    console.error("Analysis Error:", e);
    if (e.message.includes("API_KEY")) throw new Error("API_KEY_MISSING");
    throw new Error("فشل تحليل الصورة. تأكد من المفتاح أو جرب صورة أخرى.");
  }
};

export const remixImageWithGemini = async (base64Image: string, stylePrompt: string): Promise<string> => {
  validateApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Strategy 1: Direct Image-to-Image (Fastest & Best for keeping composition)
  try {
    console.log("Starting Remix Strategy 1: Direct Img2Img");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: `Redraw this image in the following style: "${stylePrompt}". Keep the same composition and main subject, but apply the art style intensely. High quality, 4k resolution.` }
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
    console.warn("Strategy 1 result contained no image data.");
  } catch (e: any) {
    console.warn("Strategy 1 Failed:", e.message);
  }

  // Strategy 2: Describe -> Generate (Fallback if direct edit fails or is blocked)
  try {
    console.log("Starting Remix Strategy 2: Describe & Generate");
    
    // Step A: Get a description (using a cheaper/faster model or the vision model)
    // We use a safe prompt to avoid safety blocks on the description itself if possible
    const descResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: "Describe the visual content of this image in detail (subject, pose, background, colors) in English." }
        ]
      }
    });
    
    const description = descResponse.text || "A creative scene";
    console.log("Generated Description:", description);

    // Step B: Generate new image based on description + style
    const genResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Generate an image. Subject: ${description}. Art Style: ${stylePrompt}. High quality, detailed masterpiece.` }
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
  } catch (e: any) {
    console.warn("Strategy 2 Failed:", e.message);
  }

  throw new Error("FAILED_GENERATION");
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Manually constructing history to avoid SDK type issues if strictly typed
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
