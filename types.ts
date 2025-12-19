
export interface Word {
  id: string;
  english: string;
  chinese: string;
  phonetic: string;
  grade: number;
  unit: number;
  emoji?: string;
}

export interface WrongWord extends Word {
  consecutiveCorrectCount: number;
}

export interface HistoryRecord {
  date: string; // ISO String
  wordsLearned: number;
  wrongCount: number;
}

export enum AppView {
  WELCOME = 'WELCOME',
  GRADE_SELECT = 'GRADE_SELECT',
  UNIT_SELECT = 'UNIT_SELECT', // New view for selecting specific unit
  MODE_SELECT = 'MODE_SELECT',
  QUIZ = 'QUIZ',
  REPORT = 'REPORT',
  WRONG_BOOK = 'WRONG_BOOK',
  STATS = 'STATS'
}

export interface AIExplanation {
  meaning: string;
  funnySentence: string;
  story: string;
  mnemonic: string;
}

export type QuizMode = 'ENG_TO_CHI' | 'CHI_TO_ENG';
