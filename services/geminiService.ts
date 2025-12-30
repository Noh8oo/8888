
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
    if (e.message.includes("API_KEY")) throw new Error("API_KEY_MISSING");
    throw new Error("فشل تحليل الصورة. تأكد من المفتاح أو جرب صورة أخرى.");
  }
};

export const remixImageWithGemini = async (base64Image: string, stylePrompt: string): Promise<string> => {
  const key = getApiKey();
  const mimeType = getMimeType(base64Image);
  const cleanBase64 = cleanBase64Data(base64Image);
  const ai = new GoogleGenAI({ apiKey: key });

  let capturedDescription = "Artistic creative image";

  // --- Strategy 1: Direct Image-to-Image (Gemini 2.5) ---
  try {
    console.log("Attempting Strategy 1: Gemini 2.5 Img2Img");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: `Transform this image into the following style: ${stylePrompt}. Maintain the composition and subject matter but change the artistic style completely. High quality, detailed.` }
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
    console.warn("Strategy 1 Failed (Gemini Img2Img):", e.message);
  }

  // --- Strategy 2: Describe then Generate (Gemini 2.5) ---
  try {
    console.log("Attempting Strategy 2: Describe & Generate (Gemini 2.5)");
    
    // Step A: Get Description (using the robust text model)
    const descResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: "Briefly describe the visual content of this image (subject, colors, setting) in English for image generation purposes." }
        ]
      }
    });
    capturedDescription = descResponse.text || capturedDescription;
    
    // Step B: Generate
    const genResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Generate an image. Subject: ${capturedDescription}. Art Style: ${stylePrompt}. High resolution, masterpiece.` }
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
    console.warn("Strategy 2 Failed (Gemini Gen):", e.message);
  }

  // --- Strategy 3: Imagen 3 Fallback (The Savior) ---
  try {
    console.log("Attempting Strategy 3: Imagen 3 Fallback");
    // Imagen 3 is often more stable for pure generation requests
    const imagenResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: `${capturedDescription}, in the style of ${stylePrompt}, high quality`,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1', // Standard safe aspect ratio
        outputMimeType: 'image/jpeg'
      },
    });

    const imageBytes = imagenResponse.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
      return `data:image/jpeg;base64,${imageBytes}`;
    }
  } catch (e: any) {
    console.warn("Strategy 3 Failed (Imagen):", e.message);
  }

  throw new Error("FAILED_GENERATION: All strategies failed. Please try again later.");
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
