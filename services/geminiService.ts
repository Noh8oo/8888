
import { GoogleGenAI } from "@google/genai";
import { ImageAnalysis } from "../types";

// Standard initialization using the environment key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const EDITING_MODEL = 'gemini-2.5-flash-image';

const cleanBase64Data = (base64: string): string => {
  if (base64.includes(',')) return base64.split(',')[1];
  return base64;
};

// Balanced safety settings for the free tier
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  try {
    const ai = getAI();
    const cleanImage = cleanBase64Data(base64Image);
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanImage } },
          { text: `Analyze this image in detail. Return ONLY a valid JSON object: { "colors": ["#hex1", "#hex2"], "style": "Arabic style name", "layout": "Arabic description", "layoutDetail": "Detailed Arabic blueprint", "view": "Arabic angle", "viewDetail": "Detailed Arabic camera info", "objects": ["Arabic object 1", "Arabic object 2"], "prompt": "Comprehensive Arabic prompt for recreation" }` }
        ]
      }],
      config: { 
        responseMimeType: "application/json",
        safetySettings: SAFETY_SETTINGS 
      }
    });

    const text = response.text || "{}";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as ImageAnalysis;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return { 
      colors: ["#1E88E5", "#42A5F5"], 
      style: "تحليل كلاسيكي", 
      layout: "تخطيط متوازن", 
      view: "منظور عين الطائر", 
      objects: ["عناصر بصرية"], 
      prompt: "تعذر الحصول على وصف كامل، يرجى إعادة المحاولة." 
    };
  }
};

export const remixImageWithGemini = async (base64Image: string, instruction: string, mode: 'restore' | 'creative' = 'restore'): Promise<string> => {
  try {
    const ai = getAI();
    const cleanImage = cleanBase64Data(base64Image);
    
    // Efficient prompting for stable results on free tier
    const prompt = mode === 'restore' 
      ? `Professional restoration: Sharpen details, fix pixelation, remove noise, and enhance clarity. Instructions: ${instruction}`
      : `Artistic modification: ${instruction}. Maintain high quality and realistic details.`;

    const response = await ai.models.generateContent({
      model: EDITING_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanImage } },
          { text: prompt }
        ]
      },
      config: { 
        safetySettings: SAFETY_SETTINGS,
        temperature: 0.5
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("لم يتمكن النظام من توليد الصورة. حاول تغيير الوصف أو حجم الصورة.");

  } catch (error: any) {
    console.error("Remix Error:", error);
    if (error.message.includes("candidate")) {
        throw new Error("عذراً، رفض النظام معالجة هذه الصورة لدواعي الأمان أو الحماية.");
    }
    throw new Error("حدث خطأ أثناء المعالجة، يرجى المحاولة مرة أخرى.");
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{ role: "user", parts: [{ text: `Original Prompt: "${originalDescription}". Modification: "${userInstruction}". Rewrite a new improved description in Arabic only.` }] }],
      config: { safetySettings: SAFETY_SETTINGS }
    });
    return response.text || originalDescription;
  } catch (error) { return originalDescription; }
};

export const chatWithGemini = async (history: any[], message: string): Promise<string> => {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: ANALYSIS_MODEL,
      history: history,
      config: { 
        systemInstruction: "أنت لومينا، مساعد ذكي متخصص في التصميم وتحليل الصور. ردودك يجب أن تكون ملهمة ومختصرة وباللغة العربية.",
        safetySettings: SAFETY_SETTINGS
      }
    });
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) { return "عذراً، لا يمكنني الرد الآن. حاول لاحقاً."; }
};
