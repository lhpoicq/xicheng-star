
import { GoogleGenAI, Type } from "@google/genai";
import { AIExplanation } from "../types.ts";

export async function getWordExplanation(word: string, grade: number): Promise<AIExplanation | null> {
  try {
    // Obtain API Key safely
    const apiKey = (globalThis as any).process?.env?.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is not defined in environment variables.");
      return null;
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
            meaning: { type: Type.STRING, description: "单词含义的口语化简易解释" },
            funnySentence: { type: Type.STRING, description: "一个超级搞笑且简单的英文例句" },
            story: { type: Type.STRING, description: "一句话的小故事，帮助记忆" },
            mnemonic: { type: Type.STRING, description: "谐音或拆分联想记忆法" }
          },
          required: ["meaning", "funnySentence", "story", "mnemonic"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIExplanation;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}
