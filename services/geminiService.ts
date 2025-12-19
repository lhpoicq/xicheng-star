
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是北京市西城区的一位资深小学英语老师。针对${grade}年级的孩子，用最亲切、幽默、充满童趣的口吻，为单词 "${word}" 提供一个有趣的记忆法。请注意避开复杂的语法。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { type: Type.STRING, description: "单词的中文意思" },
            funnySentence: { type: Type.STRING, description: "一个有趣的短例句" },
            story: { type: Type.STRING, description: "关于这个单词的小故事" },
            mnemonic: { type: Type.STRING, description: "生动好记的联想记忆法" }
          },
          required: ["meaning", "funnySentence", "story", "mnemonic"]
        }
      }
    });

    return response.text ? JSON.parse(response.text) : fallback;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return fallback;
  }
}
