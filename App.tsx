
import React, { useState, useEffect } from 'react';
import { AppView, Word, AIExplanation, WrongWord, QuizMode, HistoryRecord } from './types.ts';
import { GRADES, MOCK_WORDS } from './constants.ts';
import GradeCard from './components/GradeCard.tsx';
import Mascot from './components/Mascot.tsx';
import { getWordExplanation } from './services/geminiService.ts';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.WELCOME);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | 'all' | null>(null);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [sessionLength, setSessionLength] = useState<number | 'all'>(10);
  
  const [quizMode, setQuizMode] = useState<QuizMode>('ENG_TO_CHI');
  const [userAnswer, setUserAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correctInSession, setCorrectInSession] = useState(0);
  const [wrongInSession, setWrongInSession] = useState(0);

  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  const [learningHistory, setLearningHistory] = useState<HistoryRecord[]>([]);
  const [testedWordIds, setTestedWordIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedWrong = localStorage.getItem('xicheng_wrong_book');
      const savedHistory = localStorage.getItem('xicheng_history');
      const savedTested = localStorage.getItem('xicheng_tested_ids');
      if (savedWrong) setWrongWords(JSON.parse(savedWrong));
      if (savedHistory) setLearningHistory(JSON.parse(savedHistory));
      if (savedTested) setTestedWordIds(JSON.parse(savedTested));
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('xicheng_wrong_book', JSON.stringify(wrongWords));
    localStorage.setItem('xicheng_history', JSON.stringify(learningHistory));
    localStorage.setItem('xicheng_tested_ids', JSON.stringify(testedWordIds));
  }, [wrongWords, learningHistory, testedWordIds]);

  useEffect(() => {
    if (view === AppView.QUIZ && sessionWords.length > 0 && currentWordIndex < sessionWords.length && quizMode === 'ENG_TO_CHI') {
      const currentWord = sessionWords[currentWordIndex];
      const otherWords = MOCK_WORDS.filter(w => w.chinese !== currentWord.chinese);
      const distractors = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.chinese);
      const allOptions = [...distractors, currentWord.chinese].sort(() => 0.5 - Math.random());
      setOptions(allOptions);
    }
  }, [view, currentWordIndex, sessionWords, quizMode]);

  const speak = (text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech error", e);
    }
  };

  const handleGradeSelect = (grade: number) => {
    setSelectedGrade(grade);
    setSelectedUnit(null); 
    setView(AppView.UNIT_SELECT);
  };

  const handleUnitClick = (unit: number | 'all') => {
    setSelectedUnit(unit);
  };

  const proceedToModeSelect = () => {
    if (selectedUnit !== null) {
      setView(AppView.MODE_SELECT);
    }
  };

  const startSession = (grade: number, unit: number | 'all', mode: QuizMode, length: number | 'all') => {
    let pool = MOCK_WORDS.filter(w => w.grade === grade);
    if (unit !== 'all') {
      pool = pool.filter(w => w.unit === unit);
    }

    let availableWords = pool.filter(w => !testedWordIds.includes(w.id));
    
    if (availableWords.length === 0) {
      const wordIdsInPool = pool.map(w => w.id);
      setTestedWordIds(prev => prev.filter(id => !wordIdsInPool.includes(id)));
      availableWords = pool;
    }
    
    const shuffledPool = [...availableWords].sort(() => 0.5 - Math.random());
    const finalWords = length === 'all' ? shuffledPool : shuffledPool.slice(0, length);
    
    if (finalWords.length === 0) {
       alert("该单元暂无词汇，请选择其他单元。");
       setView(AppView.UNIT_SELECT);
       return;
    }

    setSessionWords(finalWords);
    setQuizMode(mode);
    setCurrentWordIndex(0);
    setCorrectInSession(0);
    setWrongInSession(0);
    setView(AppView.QUIZ); 
    setExplanation(null);
    setQuizFeedback(null);
    setUserAnswer('');
  };

  const moveToNext = () => {
    if (currentWordIndex < sessionWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setQuizFeedback(null);
      setUserAnswer('');
      setExplanation(null);
    } else {
      const newRecord: HistoryRecord = {
        date: new Date().toISOString(),
        wordsLearned: sessionWords.length,
        wrongCount: wrongInSession + (quizFeedback === 'wrong' ? 1 : 0)
      };
      setLearningHistory(prev => [...prev, newRecord]);
      setView(AppView.REPORT);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (quizFeedback !== null) return;
    const currentWord = sessionWords[currentWordIndex];
    const isCorrect = quizMode === 'ENG_TO_CHI' 
      ? answer === currentWord.chinese 
      : answer.toLowerCase().trim() === currentWord.english.toLowerCase().trim();

    if (isCorrect) {
      setQuizFeedback('correct');
      setCorrectInSession(prev => prev + 1);
      speak(currentWord.english);
      setTestedWordIds(prev => Array.from(new Set([...prev, currentWord.id])));
      setWrongWords(prev => {
        const existing = prev.find(w => w.id === currentWord.id);
        if (existing) {
          const newCount = existing.consecutiveCorrectCount + 1;
          return newCount >= 3 ? prev.filter(w => w.id !== currentWord.id) : prev.map(w => w.id === currentWord.id ? { ...w, consecutiveCorrectCount: newCount } : w);
        }
        return prev;
      });
      setTimeout(moveToNext, 800);
    } else {
      setQuizFeedback('wrong');
      setWrongInSession(prev => prev + 1);
      speak("Oops");
      setWrongWords(prev => {
        const existing = prev.find(w => w.id === currentWord.id);
        if (existing) return prev.map(w => w.id === currentWord.id ? { ...w, consecutiveCorrectCount: 0 } : w);
        return [...prev, { ...currentWord, consecutiveCorrectCount: 0 }];
      });
      setAiLoading(true);
      getWordExplanation(currentWord.english, selectedGrade || 1).then(res => {
        setExplanation(res);
        setAiLoading(false);
      });
      // 这里的 setTimeout 会在一定时间后自动跳转，但也允许用户点击按钮手动跳转
    }
  };

  const resetProgress = () => {
    if (confirm("确定要重置所有已过关单词记录吗？")) {
      setTestedWordIds([]);
      localStorage.removeItem('xicheng_tested_ids');
      window.location.reload();
    }
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border-8 border-yellow-400 p-4 overflow-hidden">
            <img src="https://picsum.photos/seed/star-fltrp/200/200" alt="FLTRP Mascot" className="w-full h-full object-cover rounded-full" />
        </div>
        <div className="absolute -bottom-4 -right-4 bg-red-500 text-white font-cartoon text-lg px-4 py-1 rounded-full shadow-lg -rotate-12 border-4 border-white">
          离线可用版
        </div>
      </div>
      <h1 className="text-5xl md:text-7xl font-cartoon text-blue-600 mb-6 drop-shadow-md">西城英语小状元</h1>
      <div className="mb-10 flex flex-col items-center space-y-4">
        <div className="bg-white px-8 py-3 rounded-full shadow-sm border border-blue-50">
           <span className="text-blue-800 font-bold">内置完整词库，断网也能背！</span>
        </div>
        <span className="font-bold text-blue-800 text-lg">🎯 闯关词量</span>
        <div className="flex bg-white p-2 rounded-full shadow-inner border">
          {[5, 10, 20, 'all'].map(len => (
            <button
              key={len}
              onClick={() => setSessionLength(len as any)}
              className={`px-5 py-2 rounded-full font-bold transition ${sessionLength === len ? 'bg-blue-500 text-white shadow-md' : 'text-blue-400 hover:bg-blue-50'}`}
            >
              {len === 'all' ? '全部' : len}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
        <button onClick={() => setView(AppView.GRADE_SELECT)} className="bg-blue-600 hover:bg-blue-700 text-white font-cartoon text-3xl px-14 py-6 rounded-full shadow-2xl transition hover:scale-105 border-b-8 border-blue-900">同步闯关 🚀</button>
        <button onClick={() => setView(AppView.WRONG_BOOK)} className="bg-red-500 hover:bg-red-600 text-white font-cartoon text-3xl px-14 py-6 rounded-full shadow-2xl transition hover:scale-105 border-b-8 border-red-900">错题本 ({wrongWords.length})</button>
      </div>
      <button onClick={resetProgress} className="mt-12 text-gray-400 text-sm hover:text-red-400 underline transition">
        重置进度 (当前过关: {testedWordIds.length})
      </button>
    </div>
  );

  const renderGradeSelect = () => (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex items-center space-x-4 mb-12">
        <button onClick={() => setView(AppView.WELCOME)} className="bg-white p-3 rounded-full shadow-md text-blue-600 hover:scale-110 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h2 className="text-4xl font-cartoon text-blue-600">选择年级</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {GRADES.map(grade => {
          const gradeWords = MOCK_WORDS.filter(w => w.grade === grade);
          const totalGradeWords = gradeWords.length;
          const testedGradeWords = gradeWords.filter(w => testedWordIds.includes(w.id)).length;
          return (
            <div key={grade} className="relative">
              <GradeCard grade={grade} isSelected={selectedGrade === grade} onClick={handleGradeSelect} />
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm border border-blue-50">
                过关: {testedGradeWords}/{totalGradeWords}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderUnitSelect = () => {
    const relevantWords = MOCK_WORDS.filter(w => w.grade === selectedGrade);
    const units = Array.from(new Set(relevantWords.map(w => w.unit))).sort((a, b) => a - b);
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in text-center pb-32">
        <div className="flex items-center space-x-4 mb-12 text-left">
          <button onClick={() => setView(AppView.GRADE_SELECT)} className="bg-white p-3 rounded-full shadow-md text-blue-600 hover:scale-110 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
          <h2 className="text-4xl font-cartoon text-blue-600">{selectedGrade}年级 - 选择单元</h2>
        </div>
        
        {units.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border-4 border-dashed border-gray-100">
            <p className="text-gray-400 text-2xl font-cartoon">该年级词库正在整理中，请选择三年级进行体验！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <button 
              onClick={() => handleUnitClick('all')}
              className={`p-8 rounded-[2rem] font-cartoon text-3xl shadow-lg transition transform hover:scale-[1.03] border-4 flex flex-col items-center justify-center ${selectedUnit === 'all' ? 'bg-blue-600 text-white border-yellow-400 border-[6px]' : 'bg-blue-100 text-blue-800 border-transparent'}`}
            >
              <span>全部单词</span>
              <span className="text-sm font-sans mt-2 opacity-80">All Words</span>
              {selectedUnit === 'all' && <div className="mt-2 text-sm bg-yellow-400 text-blue-900 px-3 py-1 rounded-full">已选中</div>}
            </button>
            {units.map(unit => {
              const unitWords = relevantWords.filter(w => w.unit === unit);
              const testedUnitWords = unitWords.filter(w => testedWordIds.includes(w.id)).length;
              const isDone = testedUnitWords === unitWords.length && unitWords.length > 0;
              const isWelcome = unit === 0;
              const isSelected = selectedUnit === unit;
              
              return (
                <button 
                  key={unit}
                  onClick={() => handleUnitClick(unit)}
                  className={`relative p-8 rounded-[2rem] font-cartoon text-3xl shadow-md transition border-[6px] group flex flex-col items-center justify-center ${isSelected ? 'border-yellow-400 bg-blue-50 scale-[1.05] z-10' : 'border-transparent bg-white hover:bg-blue-50'}`}
                >
                  <span className={isSelected ? 'text-blue-600' : isDone ? 'text-green-700' : isWelcome ? 'text-yellow-800' : 'text-blue-800'}>
                    {isWelcome ? 'Welcome' : `Unit ${unit}`}
                  </span>
                  <div className="text-sm text-gray-400 mt-2 font-sans font-bold group-hover:text-blue-500 transition">
                    {testedUnitWords}/{unitWords.length} 已背
                  </div>
                  {isDone && <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full text-xs shadow-sm">✓</div>}
                  {isSelected && (
                    <div className="absolute -top-4 bg-yellow-400 text-blue-900 px-4 py-1 rounded-full text-sm font-bold shadow-md animate-bounce">
                      已选定！
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {selectedUnit !== null && (
          <div className="fixed bottom-10 left-0 w-full flex justify-center px-4 animate-fade-in z-50">
            <button 
              onClick={proceedToModeSelect}
              className="bg-green-500 hover:bg-green-600 text-white font-cartoon text-4xl px-20 py-6 rounded-full shadow-[0_15px_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105 active:scale-95 border-b-8 border-green-800 flex items-center space-x-4"
            >
              <span>确认进入 {selectedUnit === 'all' ? '全部单词' : selectedUnit === 0 ? 'Welcome' : `Unit ${selectedUnit}`}</span>
              <span className="text-5xl">🚀</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderModeSelect = () => (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in text-center">
      <div className="flex items-center space-x-4 mb-6 text-left">
        <button onClick={() => setView(AppView.UNIT_SELECT)} className="bg-white p-3 rounded-full shadow-md text-blue-600 hover:scale-110 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h2 className="text-4xl font-cartoon text-blue-600">挑战模式</h2>
      </div>

      <div className="mb-10 p-4 bg-blue-50 rounded-3xl border-2 border-blue-100 flex items-center justify-center space-x-3">
         <span className="text-blue-400 text-2xl">📍</span>
         <span className="text-blue-800 font-bold text-xl">
           当前选择：{selectedGrade}年级 - {selectedUnit === 'all' ? '全部单词' : selectedUnit === 0 ? 'Welcome 单元' : `Unit ${selectedUnit}`}
         </span>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <button 
          onClick={() => startSession(selectedGrade!, selectedUnit!, 'ENG_TO_CHI', sessionLength)}
          className="bg-white p-10 rounded-[3rem] shadow-xl border-4 border-blue-100 hover:border-blue-400 transition transform hover:scale-105 group"
        >
          <div className="text-7xl mb-4 group-hover:rotate-12 transition">🔍</div>
          <h3 className="text-3xl font-cartoon text-blue-800 mb-2">看英选意</h3>
          <p className="text-gray-400">阅读英文，选择中文意思</p>
        </button>
        <button 
          onClick={() => startSession(selectedGrade!, selectedUnit!, 'CHI_TO_ENG', sessionLength)}
          className="bg-white p-10 rounded-[3rem] shadow-xl border-4 border-green-100 hover:border-green-400 transition transform hover:scale-105 group"
        >
          <div className="text-7xl mb-4 group-hover:-rotate-12 transition">✍️</div>
          <h3 className="text-3xl font-cartoon text-green-800 mb-2">看中拼英</h3>
          <p className="text-gray-400">阅读中文，拼写英文单词</p>
        </button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const word = sessionWords[currentWordIndex];
    if (!word) return null;
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-blue-800 font-bold bg-white px-4 py-1 rounded-full shadow-sm">
              进度 {currentWordIndex + 1} / {sessionWords.length}
            </span>
            <span className="text-green-600 font-bold">
              {word.unit === 0 ? 'Welcome' : `Unit ${word.unit}`} | {quizMode === 'ENG_TO_CHI' ? '看英选意' : '看中拼英'}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden shadow-inner border border-white">
            <div 
              className="bg-blue-500 h-full transition-all duration-500" 
              style={{ width: `${((currentWordIndex + 1) / sessionWords.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className={`bg-white rounded-[3.5rem] shadow-2xl p-12 border-8 transition-all duration-300 transform ${quizFeedback === 'correct' ? 'border-green-400 scale-[1.01]' : quizFeedback === 'wrong' ? 'border-red-400' : 'border-blue-100'}`}>
          <div className="text-center mb-10">
            <h2 className={`font-bold text-blue-900 mb-6 tracking-tight ${word.english.length > 10 ? 'text-5xl md:text-6xl' : 'text-7xl md:text-8xl'}`}>
              {quizMode === 'ENG_TO_CHI' ? word.english : word.chinese}
            </h2>
            <div className="flex items-center justify-center space-x-3">
               <button onClick={() => speak(word.english)} className="bg-blue-50 text-blue-500 w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-100 transition shadow-sm active:scale-90">🔊</button>
               <span className="text-gray-400 font-bold text-xl">{word.phonetic}</span>
               {word.emoji && <span className="text-4xl ml-2">{word.emoji}</span>}
            </div>
          </div>
          {quizMode === 'ENG_TO_CHI' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {options.map((opt, i) => (
                <button
                  key={i}
                  disabled={quizFeedback !== null}
                  onClick={() => handleQuizAnswer(opt)}
                  className={`p-6 text-2xl font-bold rounded-3xl border-4 transition transform active:scale-95 ${quizFeedback === 'correct' && opt === word.chinese ? 'bg-green-100 border-green-500 text-green-700 shadow-lg' : quizFeedback === 'wrong' && opt === word.chinese ? 'bg-green-50 border-green-300 text-green-600 animate-pulse' : 'bg-gray-50 border-gray-100 text-blue-800 hover:border-blue-300 hover:bg-white shadow-sm'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <input
                type="text"
                autoFocus
                disabled={quizFeedback !== null}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuizAnswer(userAnswer)}
                placeholder="在此输入英文单词..."
                className={`w-full max-w-lg text-4xl font-bold p-8 border-4 rounded-[2rem] text-center mb-8 focus:border-blue-500 outline-none shadow-inner transition ${quizFeedback === 'wrong' ? 'border-red-400 bg-red-50 text-red-700' : 'border-blue-100 bg-blue-50 text-blue-800'}`}
              />
              {quizFeedback === 'wrong' && (
                <div className="text-center animate-fade-in mb-6">
                  <p className="text-red-600 font-bold text-3xl mb-4">哎呀！正确拼写：<span className="underline decoration-green-500">{word.english}</span></p>
                </div>
              )}
              {!quizFeedback && (
                <button
                  onClick={() => handleQuizAnswer(userAnswer)}
                  className="bg-blue-600 text-white px-16 py-5 rounded-2xl font-cartoon text-3xl shadow-xl hover:bg-blue-700 transition active:scale-95 border-b-8 border-blue-900"
                >
                  确认
                </button>
              )}
            </div>
          )}
          
          {(quizFeedback === 'wrong' || (quizFeedback === 'correct' && currentWordIndex < sessionWords.length)) && (
            <div className="mt-8 border-t-2 border-dashed border-gray-100 pt-8 animate-fade-in flex flex-col items-center">
              {aiLoading ? (
                <div className="flex items-center justify-center space-x-2 text-blue-500 font-bold animate-pulse">
                   <span>✨</span><span>正在编写状元记忆法...</span>
                </div>
              ) : explanation && quizFeedback === 'wrong' && (
                <div className="bg-yellow-50 p-8 rounded-[2.5rem] border-2 border-yellow-200 text-left shadow-inner w-full mb-6">
                  <p className="text-yellow-900 font-bold mb-3 flex items-center">
                     <span className="mr-2">💡</span> 状元记忆法：
                  </p>
                  <p className="text-gray-800 mb-2 font-medium"><strong>意思：</strong>{explanation.meaning}</p>
                  <p className="text-gray-800 mb-4 font-medium"><strong>巧记：</strong>{explanation.mnemonic}</p>
                </div>
              )}
              
              {quizFeedback === 'wrong' && (
                <button 
                  onClick={moveToNext}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-12 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 text-xl"
                >
                  我记住了，继续闯关 🚀
                </button>
              )}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Mascot message={quizFeedback === 'correct' ? '真棒！这一关稳了！' : quizFeedback === 'wrong' ? '别灰心，看看记忆法再继续！' : '加油小状元，全神贯注！'} />
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    const accuracy = Math.round((correctInSession / (correctInSession + wrongInSession)) * 100) || 0;
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-white rounded-[4rem] shadow-2xl p-16 border-8 border-yellow-400 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-400 via-yellow-400 to-green-400"></div>
          <div className="text-9xl mb-10 animate-bounce">🎖️</div>
          <h2 className="text-5xl font-cartoon text-blue-600 mb-8">闯关成功！</h2>
          <div className="grid grid-cols-2 gap-6 mb-12">
             <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm">
                <p className="text-gray-400 font-bold mb-2">本次过关单词</p>
                <p className="text-5xl font-cartoon text-blue-600">{sessionWords.length}</p>
             </div>
             <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm">
                <p className="text-gray-400 font-bold mb-2">本场正确率</p>
                <p className="text-5xl font-cartoon text-green-600">{accuracy}%</p>
             </div>
          </div>
          <div className="flex flex-col space-y-6">
             <button onClick={() => setView(AppView.UNIT_SELECT)} className="w-full bg-blue-600 text-white font-cartoon text-4xl py-6 rounded-3xl shadow-2xl hover:scale-[1.02] transition border-b-8 border-blue-900">去闯下一关</button>
             <button onClick={() => setView(AppView.WELCOME)} className="w-full bg-gray-100 text-gray-500 font-cartoon text-3xl py-5 rounded-3xl hover:bg-gray-200 transition">回到主页</button>
          </div>
        </div>
      </div>
    );
  };

  const renderWrongBook = () => (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView(AppView.WELCOME)} className="bg-white p-3 rounded-full shadow-md text-blue-600 hover:scale-110 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
          <h2 className="text-4xl font-cartoon text-red-600">错题加油站 ⛽</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
           <button onClick={() => startWrongBookSession('ENG_TO_CHI')} disabled={wrongWords.length === 0} className="bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-lg disabled:opacity-50 hover:bg-blue-600 transition">英选意复习</button>
           <button onClick={() => startWrongBookSession('CHI_TO_ENG')} disabled={wrongWords.length === 0} className="bg-green-500 text-white px-8 py-4 rounded-full font-bold shadow-lg disabled:opacity-50 hover:bg-green-600 transition">中拼英复习</button>
        </div>
      </div>
      {wrongWords.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[4rem] shadow-inner border-4 border-dashed border-gray-200">
           <p className="text-gray-400 text-3xl font-cartoon">笔记本干干净净，你是真正的状元！🎖️</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {wrongWords.map(w => (
            <div key={w.id} className="bg-white p-8 rounded-[2rem] shadow-md border-4 border-red-50 hover:border-red-200 transition group relative">
              <div className="absolute top-6 right-6 flex space-x-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full ${w.consecutiveCorrectCount >= i ? 'bg-green-400 shadow-sm' : 'bg-gray-100'}`}></div>
                ))}
              </div>
              <h4 className="text-3xl font-bold text-gray-800 mb-2">{w.english}</h4>
              <p className="text-gray-500 text-xl mb-4">{w.chinese}</p>
              <div className="flex items-center space-x-3">
                 <button onClick={() => speak(w.english)} className="text-blue-500 text-2xl hover:scale-125 transition active:scale-90">🔊</button>
                 <span className="text-xs text-gray-400 font-bold uppercase">{w.unit === 0 ? 'Welcome' : `Unit ${w.unit}`} | {w.grade}年级</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const startWrongBookSession = (mode: QuizMode) => {
    const shuffled = [...wrongWords].sort(() => 0.5 - Math.random());
    setSessionWords(shuffled);
    setQuizMode(mode);
    setCurrentWordIndex(0);
    setCorrectInSession(0);
    setWrongInSession(0);
    setView(AppView.QUIZ);
    setExplanation(null);
    setQuizFeedback(null);
    setUserAnswer('');
  };

  return (
    <div className="min-h-screen relative pb-20 overflow-x-hidden">
      <div className="blob -top-20 -left-20"></div>
      <div className="blob top-1/2 -right-20 opacity-50"></div>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-8 py-5 flex justify-between items-center shadow-sm border-b border-blue-50">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setView(AppView.WELCOME)}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-cartoon text-3xl shadow-lg transform rotate-6 group-hover:rotate-0 transition-transform">★</div>
          <span className="text-2xl font-cartoon text-blue-800 tracking-tight">西城小状元</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white px-5 py-2 rounded-full shadow-inner border border-blue-50 flex items-center space-x-4">
             <div className="flex items-center space-x-1" title="待复习错题">
                <span className="text-red-500 font-bold">📕 {wrongWords.length}</span>
             </div>
             <div className="w-px h-5 bg-gray-200"></div>
             <div className="flex items-center space-x-1" title="已过关单词">
                <span className="text-yellow-600 font-bold">⭐ {testedWordIds.length}</span>
             </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-7xl pt-8">
        {view === AppView.WELCOME && renderWelcome()}
        {view === AppView.GRADE_SELECT && renderGradeSelect()}
        {view === AppView.UNIT_SELECT && renderUnitSelect()}
        {view === AppView.MODE_SELECT && renderModeSelect()}
        {view === AppView.QUIZ && renderQuiz()}
        {view === AppView.REPORT && renderReport()}
        {view === AppView.WRONG_BOOK && renderWrongBook()}
      </main>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
