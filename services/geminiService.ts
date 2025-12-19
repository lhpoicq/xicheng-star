
import { GoogleGenAI, Type } from "@google/genai";
import { AIExplanation } from "../types.ts";

/**
 * 获取 AI 单词解析。
 * 如果离线或 API 调用失败，返回本地兜底提示。
 */
export async function getWordExplanation(word: string, grade: number): Promise<AIExplanation | null> {
  // 本地兜底内容
  const fallback: AIExplanation = {
    meaning: "这个单词是西城英语教材里的重要成员哦！",
    funnySentence: `Keep practicing: ${word}!`,
    story: "多读几遍，你会发现记忆它的窍门。",
    mnemonic: "可以尝试把单词拆开来记，或者大声朗读三遍！"
  };

  try {
    // 检查是否有 API Key
    if (!process.env.API_KEY || process.env.API_KEY === 'undefined') {
      console.warn("未检测到 API_KEY，切换至离线提示模式。");
      return fallback;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    if (!text) return fallback;
    return JSON.parse(text) as AIExplanation;
  } catch (error) {
    console.error("AI 服务暂不可用，已切换为本地提示:", error);
    // 报错时返回本地兜底，不打断学习流程
    return fallback;
  }
}
