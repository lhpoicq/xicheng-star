
import React, { useState, useEffect } from 'react';
import { AppView, Word, AIExplanation, WrongWord, QuizMode } from './types.ts';
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
  const [sessionLength] = useState<number | 'all'>(10);
  
  const [quizMode, setQuizMode] = useState<QuizMode>('ENG_TO_CHI');
  const [userAnswer, setUserAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [testedWordIds, setTestedWordIds] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);

  // 这里的持久化确保存储在浏览器中
  useEffect(() => {
    const savedWrong = localStorage.getItem('xicheng_wrong_book');
    const savedTested = localStorage.getItem('xicheng_tested_ids');
    if (savedWrong) setWrongWords(JSON.parse(savedWrong));
    if (savedTested) setTestedWordIds(JSON.parse(savedTested));
  }, []);

  useEffect(() => {
    localStorage.setItem('xicheng_wrong_book', JSON.stringify(wrongWords));
    localStorage.setItem('xicheng_tested_ids', JSON.stringify(testedWordIds));
  }, [wrongWords, testedWordIds]);

  // 为“看英选意”模式生成选项
  useEffect(() => {
    if (view === AppView.QUIZ && sessionWords[currentWordIndex] && quizMode === 'ENG_TO_CHI') {
      const currentWord = sessionWords[currentWordIndex];
      const otherWords = MOCK_WORDS.filter(w => w.chinese !== currentWord.chinese);
      const distractors = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.chinese);
      setOptions([...distractors, currentWord.chinese].sort(() => 0.5 - Math.random()));
    }
  }, [view, currentWordIndex, sessionWords, quizMode]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const startSession = (grade: number, unit: number | 'all', mode: QuizMode) => {
    let pool = MOCK_WORDS.filter(w => w.grade === grade);
    if (unit !== 'all') pool = pool.filter(w => w.unit === unit);
    
    if (pool.length === 0) return alert("该单元暂无词汇！");

    const shuffled = pool.sort(() => 0.5 - Math.random());
    const finalWords = sessionLength === 'all' ? shuffled : shuffled.slice(0, sessionLength as number);
    
    setSessionWords(finalWords);
    setQuizMode(mode);
    setCurrentWordIndex(0);
    setView(AppView.QUIZ);
    setQuizFeedback(null);
    setUserAnswer('');
    setExplanation(null);
  };

  const handleQuizAnswer = (answer: string) => {
    if (quizFeedback !== null) return;
    const currentWord = sessionWords[currentWordIndex];
    const isCorrect = quizMode === 'ENG_TO_CHI' 
      ? answer === currentWord.chinese 
      : answer.toLowerCase().trim() === currentWord.english.toLowerCase().trim();

    if (isCorrect) {
      setQuizFeedback('correct');
      speak(currentWord.english);
      setTestedWordIds(prev => Array.from(new Set([...prev, currentWord.id])));
      setTimeout(() => {
        if (currentWordIndex < sessionWords.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
          setQuizFeedback(null);
          setUserAnswer('');
          setExplanation(null);
        } else setView(AppView.REPORT);
      }, 800);
    } else {
      setQuizFeedback('wrong');
      setWrongWords(prev => {
        const exists = prev.find(w => w.id === currentWord.id);
        if (exists) return prev;
        return [...prev, { ...currentWord, consecutiveCorrectCount: 0 }];
      });
      setAiLoading(true);
      getWordExplanation(currentWord.english, selectedGrade || 3).then(res => {
        setExplanation(res);
        setAiLoading(false);
      });
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <div className="blob -top-20 -left-20"></div>
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-8 py-5 flex justify-between items-center shadow-sm border-b border-blue-50">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView(AppView.WELCOME)}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-cartoon text-3xl shadow-lg transform rotate-6">★</div>
          <span className="text-2xl font-cartoon text-blue-800">西城小状元</span>
        </div>
        <div className="flex items-center space-x-6">
           <span className="text-red-500 font-bold">📕 {wrongWords.length}</span>
           <span className="text-yellow-600 font-bold">⭐ {testedWordIds.length}</span>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl pt-8 px-4">
        {view === AppView.WELCOME && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-cartoon text-blue-600 mb-6 drop-shadow-md">西城英语小状元</h1>
            <p className="text-blue-800 font-bold mb-12 bg-white px-8 py-3 rounded-full shadow-sm">同步北京市西城区最新外研版教材</p>
            <div className="flex flex-col sm:flex-row gap-6">
              <button onClick={() => setView(AppView.GRADE_SELECT)} className="bg-blue-600 hover:bg-blue-700 text-white font-cartoon text-3xl px-14 py-6 rounded-3xl shadow-2xl transition border-b-8 border-blue-900">同步闯关 🚀</button>
              <button onClick={() => setView(AppView.WRONG_BOOK)} className="bg-red-500 hover:bg-red-600 text-white font-cartoon text-3xl px-14 py-6 rounded-3xl shadow-2xl transition border-b-8 border-red-900">错题本</button>
            </div>
          </div>
        )}

        {view === AppView.GRADE_SELECT && (
          <div className="max-w-6xl mx-auto py-12 animate-fade-in">
            <h2 className="text-4xl font-cartoon text-blue-600 mb-12">选择你的年级</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {GRADES.map(g => (
                <GradeCard key={g} grade={g} isSelected={selectedGrade === g} onClick={(grade) => { setSelectedGrade(grade); setView(AppView.UNIT_SELECT); }} />
              ))}
            </div>
          </div>
        )}

        {view === AppView.UNIT_SELECT && (
          <div className="max-w-4xl mx-auto py-12 animate-fade-in text-center">
            <h2 className="text-4xl font-cartoon text-blue-600 mb-8">{selectedGrade}年级 - 选择单元</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              <button onClick={() => setSelectedUnit('all')} className={`p-6 rounded-2xl font-cartoon text-2xl border-4 transition ${selectedUnit === 'all' ? 'bg-blue-600 text-white border-yellow-400' : 'bg-white text-blue-800 border-blue-50'}`}>全册</button>
              {[0, 1, 2, 3, 4, 5, 6].map(u => (
                <button key={u} onClick={() => setSelectedUnit(u)} className={`p-6 rounded-2xl font-cartoon text-xl border-4 transition ${selectedUnit === u ? 'bg-blue-600 text-white border-yellow-400' : 'bg-white text-blue-800 border-blue-50'}`}>Unit {u === 0 ? 'W' : u}</button>
              ))}
            </div>
            {selectedUnit !== null && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                <button onClick={() => startSession(selectedGrade!, selectedUnit!, 'ENG_TO_CHI')} className="bg-green-500 text-white p-8 rounded-3xl font-cartoon text-2xl shadow-xl border-b-8 border-green-700">🔍 看英选意</button>
                <button onClick={() => startSession(selectedGrade!, selectedUnit!, 'CHI_TO_ENG')} className="bg-orange-500 text-white p-8 rounded-3xl font-cartoon text-2xl shadow-xl border-b-8 border-orange-700">✍️ 看中拼英</button>
              </div>
            )}
          </div>
        )}

        {view === AppView.QUIZ && sessionWords[currentWordIndex] && (
          <div className="max-w-2xl mx-auto py-8 animate-fade-in">
            <div className="bg-white rounded-[3.5rem] shadow-2xl p-10 border-8 border-blue-100 relative">
              <div className="text-center mb-10">
                <div className="text-gray-400 font-bold mb-4">进度: {currentWordIndex + 1}/{sessionWords.length}</div>
                <h2 className="text-7xl font-bold text-blue-900 mb-6">{quizMode === 'ENG_TO_CHI' ? sessionWords[currentWordIndex].english : sessionWords[currentWordIndex].chinese}</h2>
                <div className="flex items-center justify-center space-x-3">
                  <button onClick={() => speak(sessionWords[currentWordIndex].english)} className="bg-blue-50 p-3 rounded-full text-blue-500 shadow-sm">🔊</button>
                  <span className="text-gray-400 italic text-xl">{sessionWords[currentWordIndex].phonetic}</span>
                </div>
              </div>

              {quizMode === 'ENG_TO_CHI' ? (
                <div className="grid grid-cols-2 gap-4">
                  {options.map((opt, i) => (
                    <button key={i} onClick={() => handleQuizAnswer(opt)} className={`p-6 rounded-2xl text-xl font-bold border-4 transition ${quizFeedback === 'correct' && opt === sessionWords[currentWordIndex].chinese ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-50 border-gray-100 text-blue-800'}`}>{opt}</button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <input type="text" autoFocus value={userAnswer} onChange={e => setUserAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuizAnswer(userAnswer)} placeholder="输入英文..." className={`w-full text-4xl font-bold p-6 border-4 rounded-3xl text-center outline-none transition ${quizFeedback === 'wrong' ? 'border-red-400 bg-red-50' : 'border-blue-100 focus:border-blue-500 bg-blue-50'}`} />
                  {quizFeedback === 'wrong' && <p className="mt-4 text-red-600 font-bold text-2xl">答案: {sessionWords[currentWordIndex].english}</p>}
                </div>
              )}

              {quizFeedback === 'wrong' && (
                <div className="mt-8 p-6 bg-yellow-50 rounded-3xl border-2 border-yellow-200 animate-fade-in">
                  {aiLoading ? <p className="text-blue-500 animate-pulse">✨ 西城老师正在思考记忆法...</p> : explanation && (
                    <>
                      <p className="text-gray-800 mb-2 font-bold">💡 记忆窍门：</p>
                      <p className="text-gray-700 italic">{explanation.mnemonic}</p>
                      <button onClick={() => { setCurrentWordIndex(prev => prev + 1); setQuizFeedback(null); setUserAnswer(''); }} className="mt-4 w-full bg-blue-500 text-white py-3 rounded-xl">记住了，下一题</button>
                    </>
                  )}
                </div>
              )}
              <div className="mt-12 flex justify-center">
                <Mascot message={quizFeedback === 'correct' ? '你真牛！' : quizFeedback === 'wrong' ? '别气馁！' : '准备好了吗？'} />
              </div>
            </div>
          </div>
        )}

        {view === AppView.REPORT && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-9xl mb-10 animate-bounce">🏆</div>
            <h2 className="text-6xl font-cartoon text-blue-600 mb-8">闯关大成功！</h2>
            <button onClick={() => setView(AppView.WELCOME)} className="bg-blue-600 text-white px-16 py-5 rounded-full font-cartoon text-3xl shadow-xl border-b-8 border-blue-900">领取金牌</button>
          </div>
        )}

        {view === AppView.WRONG_BOOK && (
          <div className="max-w-4xl mx-auto py-12 animate-fade-in">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-cartoon text-red-600">我的错题本</h2>
              <button onClick={() => setView(AppView.WELCOME)} className="text-blue-500 font-bold">返回首页</button>
            </div>
            {wrongWords.length === 0 ? (
              <p className="text-center text-gray-400 text-2xl font-cartoon">笔记本干干净净，你是最棒的！🏅</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wrongWords.map(w => (
                  <div key={w.id} className="bg-white p-6 rounded-2xl shadow-md border-l-8 border-red-400 flex justify-between items-center">
                    <div>
                      <h4 className="text-2xl font-bold">{w.english}</h4>
                      <p className="text-gray-500">{w.chinese}</p>
                    </div>
                    <button onClick={() => speak(w.english)} className="text-2xl">🔊</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
