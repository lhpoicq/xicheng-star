
import { GoogleGenAI, Type } from "@google/genai";
import { AIExplanation } from "../types.ts";

export async function getWordExplanation(word: string, grade: number): Promise<AIExplanation | null> {
  const fallback: AIExplanation = {
    meaning: "这个单词是西城英语教材里的重要成员哦！",
    funnySentence: `Keep practicing: ${word}!`,
    story: "多读几遍，你会发现记忆它的窍门。",
    mnemonic: "可以尝试把单词拆开来记，或者大声朗读三遍！"
  };

  try {
    // 极其保险的环境变量读取方式
    let apiKey = undefined;
    try {
      apiKey = (window as any).process?.env?.API_KEY;
    } catch(e) {}

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      return fallback;
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `针对小学${grade}年级的孩子，用最简单、有趣、卡通的口吻解释单词 "${word}"。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { type: Type.STRING },
            funnySentence: { type: Type.STRING },
            story: { type: Type.STRING },
            mnemonic: { type: Type.STRING }
          },
          required: ["meaning", "funnySentence", "story", "mnemonic"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : fallback;
  } catch (error) {
    console.error("AI service error:", error);
    return fallback;
  }
}
