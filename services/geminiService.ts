import { GoogleGenAI, Type } from "@google/genai";
import { ImageAnalysis } from "../types";

let aiInstance: GoogleGenAI | null = null;

// تهيئة العميل عند الطلب فقط لضمان أن process.env تم إعداده في index.tsx
const getAi = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

// Analyze image to extract style, colors, layout, objects and generate a prompt
export const analyzeImageWithGemini = async (base64Image: string): Promise<ImageAnalysis> => {
  // Remove data URL prefix if present for the API call
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const ai = getAi(); // Get the initialized instance

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
        {
          text: `قم بتحليل هذه الصورة وقدم مخرجات منظمة بصيغة JSON.
          استخرج 5 ألوان مهيمنة (رموز hex).
          صف النمط الفني (مثلاً: حديث بسيط، كلاسيكي، إلخ) باللغة العربية.
          حدد نوع التكوين/التخطيط (مثلاً: قاعدة الأثلاث) وقدم شرحاً تفصيلياً عنه باللغة العربية.
          حدد زاوية الكاميرا (مثلاً: منظر أمامي) وقدم شرحاً تفصيلياً عنها باللغة العربية.
          استخرج قائمة بأهم العناصر والكائنات (Objects) الظاهرة في الصورة باللغة العربية.
          اكتب وصفاً نصياً دقيقاً (Prompt) باللغة العربية يمكن استخدامه لإعادة إنشاء هذه الصورة باستخدام الذكاء الاصطناعي.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          colors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "قائمة بـ 5 رموز ألوان سداسية عشرية (Hex codes)",
          },
          style: { type: Type.STRING, description: "النمط الفني للصورة باللغة العربية" },
          layout: { type: Type.STRING, description: "اسم نمط التخطيط باختصار (مثل: قاعدة الأثلاث) باللغة العربية" },
          layoutDetail: { type: Type.STRING, description: "شرح مفصل لكيفية استخدام التخطيط في الصورة وتأثيره باللغة العربية" },
          view: { type: Type.STRING, description: "اسم زاوية التصوير باختصار (مثل: زاوية منخفضة) باللغة العربية" },
          viewDetail: { type: Type.STRING, description: "شرح مفصل لزاوية التصوير وتأثيرها على المشهد باللغة العربية" },
          objects: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "قائمة بأهم العناصر والكائنات الموجودة في الصورة باللغة العربية" 
          },
          prompt: { type: Type.STRING, description: "وصف دقيق للصورة باللغة العربية لإعادة إنشائها" },
        },
        required: ["colors", "style", "layout", "layoutDetail", "view", "viewDetail", "objects", "prompt"],
      },
    },
  });

  const jsonText = response.text || "{}";
  try {
    return JSON.parse(jsonText) as ImageAnalysis;
  } catch (e) {
    console.error("Failed to parse analysis JSON", e);
    throw new Error("Analysis failed");
  }
};

// Refine or merge description based on user instruction
export const refineDescriptionWithGemini = async (originalDescription: string, userInstruction: string): Promise<string> => {
  try {
    const ai = getAi(); // Get the initialized instance
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `لديك وصف لصورة: "${originalDescription}".
      
      المطلوب: قم بتعديل هذا الوصف أو دمج تعليمات المستخدم التالية معه: "${userInstruction}".
      
      الهدف هو إنتاج وصف جديد ومحسن (Prompt) يعكس الوصف الأصلي مع التعديلات المطلوبة.
      أجب بالنص الجديد فقط بدون أي مقدمات أو شرح.`,
    });

    return response.text || originalDescription;
  } catch (error) {
    console.error("Refinement failed:", error);
    throw error;
  }
};

// Chat with Gemini
export const chatWithGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const ai = getAi(); // Get the initialized instance
  
  // Use gemini-2.5-flash for faster chat interactions
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config: {
      systemInstruction: "أنت مساعد ذكي متخصص في التصميم وتحليل الصور. أجب دائماً باللغة العربية وبأسلوب مهني وودود."
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "";
};