
import { GoogleGenAI } from "@google/genai";
import { ImageAnalysis } from "../types";

// Function to get a fresh AI instance using the current environment key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const EDITING_MODEL = 'gemini-2.5-flash-image';

const cleanBase64Data = (base64: string): string => {
  if (base64.includes(',')) return base64.split(',')[1];
  return base64;
};

// Optimal safety settings for free tier to minimize "Safety" rejections
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
          { text: `Analyze this image. Output JSON: { "colors": ["#hex"], "style": "Arabic", "layout": "Arabic", "layoutDetail": "Arabic", "view": "Arabic", "viewDetail": "Arabic", "objects": ["Arabic"], "prompt": "Arabic description" }` }
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
    // Generic fallback for free tier errors
    return { 
      colors: ["#1E88E5"], 
      style: "تحليل سريع", 
      layout: "تخطيط تلقائي", 
      view: "منظور قياسي", 
      objects: ["صورة مرفعوعة"], 
      prompt: "حدث ضغط على الخادم، يرجى المحاولة مرة أخرى لاحقاً." 
    };
  }
};

export const remixImageWithGemini = async (base64Image: string, instruction: string, mode: 'restore' | 'creative' = 'restore'): Promise<string> => {
  try {
    const ai = getAI();
    const cleanImage = cleanBase64Data(base64Image);
    
    // Very simplified technical prompt to satisfy free tier safety/complexity limits
    const finalPrompt = mode === 'restore' 
      ? `Improve clarity, fix noise, sharpen edges. Goal: ${instruction}`
      : `Apply artistic edit: ${instruction}. Keep realism.`;

    const response = await ai.models.generateContent({
      model: EDITING_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanImage } },
          { text: finalPrompt }
        ]
      },
      config: { 
        safetySettings: SAFETY_SETTINGS,
        // Lower temperature for stability in free tier
        temperature: 0.4
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("SERVER_BUSY");

  } catch (error: any) {
    console.error("Remix Error:", error);
    if (error.message?.includes("Safety") || error.message?.includes("candidate")) {
      throw new Error("الصورة تحتوي على عناصر تمنع معالجتها آلياً.");
    }
    throw new Error("الخادم مشغول حالياً بسبب كثرة الطلبات في النسخة المجانية. حاول مجدداً بعد ثوانٍ.");
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{ role: "user", parts: [{ text: `Improve: "${originalDescription}" with "${userInstruction}". Arabic only.` }] }],
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
        systemInstruction: "You are Lumina, a helpful assistant. Keep answers brief and in Arabic.",
        safetySettings: SAFETY_SETTINGS
      }
    });
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) { return "عذراً، الخدمة مشغولة حالياً."; }
};
