
import { GoogleGenAI } from "@google/genai";
import { ImageAnalysis } from "../types";

// استخدام مفتاح API من البيئة أو المفتاح المباشر كاحتياطي
const API_KEY = process.env.API_KEY || "AIzaSyD8tNXgDiYG9yDjNSVyC_dYIqzPe8lhuSs";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const EDITING_MODEL = 'gemini-2.5-flash-image';

const cleanBase64Data = (base64: string): string => {
  if (base64.includes(',')) return base64.split(',')[1];
  return base64;
};

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

// ---------------------------------------------------------
// Services
// ---------------------------------------------------------

export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  try {
    const cleanImage = cleanBase64Data(base64Image);
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanImage } },
          { text: `Analyze this image precisely. Return valid JSON only: { "colors": [], "style": "Arabic", "layout": "Arabic", "layoutDetail": "Arabic", "view": "Arabic", "viewDetail": "Arabic", "objects": ["Arabic"], "prompt": "Arabic" }` }
        ]
      }],
      config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS }
    });

    const text = response.text || "{}";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as ImageAnalysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    return { colors: ["#ccc"], style: "Error", layout: "N/A", view: "N/A", objects: [], prompt: "Error processing image." };
  }
};

export const remixImageWithGemini = async (base64Image: string, instruction: string, mode: 'restore' | 'creative' = 'restore'): Promise<string> => {
  try {
    const cleanImage = cleanBase64Data(base64Image);
    
    let finalPrompt = '';

    if (mode === 'restore') {
      // وضع الترميم والتحسين: يلتزم بخطوات تقنية صارمة
      finalPrompt = `
        Act as a professional Image Restoration AI (Super Resolution).
        Goal: "${instruction}".
        
        Mandatory Processing Steps:
        1. Super Resolution: Upscale image clarity to 4K quality.
        2. Denoising: Remove grain and sensor noise (FastNLMeans equivalent).
        3. Sharpening: Apply Unsharp Mask to define edges without halos.
        4. Color Grading: Enhance vibrance and contrast (Histogram Equalization).
        5. Output: Return the processed image ONLY. Maintain original composition perfectly.
      `;
    } else {
      // وضع التعديل الإبداعي: يتبع تعليمات المستخدم بحرية أكبر
      finalPrompt = `
        Act as an expert AI Image Editor.
        Instruction: "${instruction}".
        
        Task:
        1. Analyze the user's request carefully.
        2. Edit the image to fulfill the request (e.g., changing filters, removing objects, modifying elements).
        3. Maintain high visual quality and realism.
        4. Return the processed image ONLY.
      `;
    }

    const response = await ai.models.generateContent({
      model: EDITING_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanImage } },
          { text: finalPrompt }
        ]
      },
      // لا نستخدم responseMimeType مع موديلات الصور، الموديل سيرجع الصورة في inlineData
      config: { safetySettings: SAFETY_SETTINGS }
    });

    // استخراج الصورة من الاستجابة
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // الموديل يعيد PNG عادة
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("لم يتم توليد صورة، الرجاء المحاولة مرة أخرى.");

  } catch (error) {
    console.error("Remix/Enhance Error:", error);
    throw new Error("حدث خطأ أثناء معالجة الصورة بالذكاء الاصطناعي.");
  }
};

export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{ role: "user", parts: [{ text: `Original: "${originalDescription}". Instruction: "${userInstruction}". Rewrite in Arabic.` }] }],
      config: { safetySettings: SAFETY_SETTINGS }
    });
    return response.text || originalDescription;
  } catch (error) { return originalDescription; }
};

export const chatWithGemini = async (history: any[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: ANALYSIS_MODEL,
      history: history,
      config: { 
        systemInstruction: "You are Lumina, a helpful Arabic design assistant.",
        safetySettings: SAFETY_SETTINGS
      }
    });
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) { return "عذراً، الخدمة مشغولة حالياً."; }
};
