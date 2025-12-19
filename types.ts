
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
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ADMIN = 'ADMIN',
  WELCOME = 'WELCOME',
  GRADE_SELECT = 'GRADE_SELECT',
  UNIT_SELECT = 'UNIT_SELECT',
  MODE_SELECT = 'MODE_SELECT',
  QUIZ = 'QUIZ',
  REPORT = 'REPORT',
  WRONG_BOOK = 'WRONG_BOOK',
  STATS = 'STATS'
}

export interface UserProgress {
  testedWordIds: string[];
  wrongWords: WrongWord[];
  learningHistory: HistoryRecord[];
}

export interface UserAccount {
  username: string;
  password: string;
  role: 'user' | 'admin';
  progress: UserProgress;
}

export interface AIExplanation {
  meaning: string;
  funnySentence: string;
  story: string;
  mnemonic: string;
}

export type QuizMode = 'ENG_TO_CHI' | 'CHI_TO_ENG';
