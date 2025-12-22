
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
  // حساب تقريبي لحجم البايتات: (طول السلسلة * 3) / 4
  const sizeInBytes = (base64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // Gemini API Free Tier قد تواجه مشاكل مع الصور الأكبر من 3MB
  // نضع حداً آمناً عند 3.0MB لضمان قبول الطلب
  if (sizeInMB > 3.0) {
    throw new Error("ERROR_IMAGE_TOO_LARGE");
  }
};

// إعدادات أمان قصوى (Block None)
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

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    return JSON.parse(response.text) as ImageAnalysis;
  } catch (e: any) {
    console.error("Analysis Error:", e);
    if (e.message.includes("API_KEY")) throw new Error("ERROR_API_KEY_MISSING");
    if (e.message.includes("413") || e.message.includes("Too Large")) throw new Error("ERROR_IMAGE_TOO_LARGE");
    if (e.message.includes("429") || e.message.includes("Quota")) throw new Error("ERROR_QUOTA_EXCEEDED");
    if (e.message.includes("Failed to fetch") || e.message.includes("Network")) throw new Error("ERROR_NETWORK");
    throw new Error(`ERROR_ANALYSIS_FAILED: ${e.message}`);
  }
};

export const remixImageWithGemini = async (base64Image: string, stylePrompt: string): Promise<string> => {
  validateApiKey();
  const cleanBase64 = cleanBase64Data(base64Image);
  checkPayloadSize(cleanBase64); 
  
  const mimeType = getMimeType(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let description = "A creative artistic composition";

  // 1. المحاولة الأولى: تعديل الصورة المباشر (Image-to-Image)
  try {
    console.log("Attempt 1: Direct Remix (Img2Img)");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: `Transform this image strictly into this style: ${stylePrompt}. Maintain the composition but change the artistic style entirely.` }
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
    console.warn("Attempt 1 Failed: No image returned or safety block.");
  } catch (e: any) {
    console.warn("Attempt 1 Error:", e.message);
    if (e.message.includes("413")) throw new Error("ERROR_IMAGE_TOO_LARGE");
    if (e.message.includes("429")) throw new Error("ERROR_QUOTA_EXCEEDED");
    if (e.message.includes("API_KEY")) throw new Error("ERROR_API_KEY_MISSING");
  }

  // 2. المحاولة الثانية: استخراج الوصف + توليد جديد (Text-to-Image)
  // هذا الملاذ الآمن: نستخدم الوصف النصي فقط إذا فشلت معالجة الصورة
  try {
    console.log("Attempt 2: Describe then Generate");
    
    // استخدام نموذج أسرع للوصف لتوفير الوقت
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: "Describe the main subject, colors, and composition of this image in one English sentence." }
        ]
      }
    });
    
    if (analysisResponse.text) {
      description = analysisResponse.text;
    }
    console.log("Description obtained:", description);

    // توليد صورة جديدة
    const genResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Generate a high-quality image: ${description}. Art Style: ${stylePrompt}. Ensure high resolution and detail.` }
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
    console.warn("Attempt 2 Failed: No image generated.");

  } catch (fallbackError: any) {
    console.warn("Attempt 2 Error:", fallbackError.message);
    if (fallbackError.message.includes("429")) throw new Error("ERROR_QUOTA_EXCEEDED");
  }

  // 3. المحاولة الثالثة (الأخيرة): توليد تجريدي بناءً على النمط فقط
  try {
    console.log("Attempt 3: Last Resort (Style Only)");
    const lastResortResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Create a masterpiece image representing the concept of 'Creativity' in this specific style: ${stylePrompt}. High quality, 4k.` }
        ],
      },
      config: { safetySettings: SAFETY_SETTINGS }
    });

    const lastParts = lastResortResponse.candidates?.[0]?.content?.parts;
    if (lastParts) {
      for (const part of lastParts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (lastError) {
    console.error("All attempts failed.");
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
