
import React, { useState, useEffect } from 'react';
import { AppView, Word, AIExplanation, WrongWord, QuizMode, HistoryRecord } from './types.ts';
import { GRADES, MOCK_WORDS } from './constants.ts';
import GradeCard from './components/GradeCard.tsx';
import Mascot from './components/Mascot.tsx';
import { getWordExplanation } from './services/geminiService.ts';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.WELCOME);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [sessionLength, setSessionLength] = useState(10);
  
  // Quiz states
  const [quizMode, setQuizMode] = useState<QuizMode>('ENG_TO_CHI');
  const [userAnswer, setUserAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correctInSession, setCorrectInSession] = useState(0);
  const [wrongInSession, setWrongInSession] = useState(0);

  // Persistence
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  const [learningHistory, setLearningHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const savedWrong = localStorage.getItem('xicheng_wrong_book');
    const savedHistory = localStorage.getItem('xicheng_history');
    if (savedWrong) setWrongWords(JSON.parse(savedWrong));
    if (savedHistory) setLearningHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('xicheng_wrong_book', JSON.stringify(wrongWords));
  }, [wrongWords]);

  useEffect(() => {
    localStorage.setItem('xicheng_history', JSON.stringify(learningHistory));
  }, [learningHistory]);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const startSession = (grade: number, length: number) => {
    setSelectedGrade(grade);
    const filtered = MOCK_WORDS.filter(w => w.grade === grade);
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    setSessionWords(shuffled.slice(0, length));
    setCurrentWordIndex(0);
    setCorrectInSession(0);
    setWrongInSession(0);
    setView(AppView.QUIZ); 
    setExplanation(null);
    setQuizFeedback(null);
  };

  const startWrongBookSession = () => {
    if (wrongWords.length === 0) return;
    setSessionWords(wrongWords.slice(0, 10));
    setCurrentWordIndex(0);
    setCorrectInSession(0);
    setWrongInSession(0);
    setView(AppView.QUIZ);
    setExplanation(null);
    setQuizFeedback(null);
  };

  const handleGradeSelect = (grade: number) => {
    startSession(grade, sessionLength);
  };

  const handleAskAI = async () => {
    if (!sessionWords[currentWordIndex] || !selectedGrade) return;
    setAiLoading(true);
    const result = await getWordExplanation(sessionWords[currentWordIndex].english, selectedGrade);
    setExplanation(result);
    setAiLoading(false);
  };

  useEffect(() => {
    if (view === AppView.QUIZ && quizMode === 'ENG_TO_CHI' && sessionWords.length > 0) {
      const correct = sessionWords[currentWordIndex].chinese;
      const others = MOCK_WORDS
        .filter(w => w.chinese !== correct)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.chinese);
      setOptions([...others, correct].sort(() => 0.5 - Math.random()));
    }
  }, [view, currentWordIndex, quizMode, sessionWords]);

  const handleQuizAnswer = (answer: string) => {
    if (quizFeedback !== null) return;
    const currentWord = sessionWords[currentWordIndex];
    const isCorrect = quizMode === 'ENG_TO_CHI' 
      ? answer === currentWord.chinese 
      : answer.toLowerCase().trim() === currentWord.english.toLowerCase().trim();

    if (isCorrect) {
      setQuizFeedback('correct');
      setCorrectInSession(prev => prev + 1);
      speak("Correct!");
      
      setWrongWords(prev => {
        const existing = prev.find(w => w.id === currentWord.id);
        if (existing) {
          const newCount = existing.consecutiveCorrectCount + 1;
          return newCount >= 3 ? prev.filter(w => w.id !== currentWord.id) : prev.map(w => w.id === currentWord.id ? { ...w, consecutiveCorrectCount: newCount } : w);
        }
        return prev;
      });

      setTimeout(() => {
        if (currentWordIndex < sessionWords.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
          setQuizFeedback(null);
          setUserAnswer('');
          setExplanation(null);
        } else {
          const newRecord: HistoryRecord = {
            date: new Date().toISOString(),
            wordsLearned: sessionWords.length,
            wrongCount: wrongInSession
          };
          setLearningHistory(prev => [...prev, newRecord]);
          setView(AppView.REPORT);
        }
      }, 1000);
    } else {
      setQuizFeedback('wrong');
      setWrongInSession(prev => prev + 1);
      speak("Try again");
      
      setWrongWords(prev => {
        const existing = prev.find(w => w.id === currentWord.id);
        if (existing) return prev.map(w => w.id === currentWord.id ? { ...w, consecutiveCorrectCount: 0 } : w);
        return [...prev, { ...currentWord, consecutiveCorrectCount: 0 }];
      });
      handleAskAI();
    }
  };

  const getStatsForRange = (days: number | 'all') => {
    const now = new Date();
    const filtered = learningHistory.filter(h => {
      if (days === 'all') return true;
      const recordDate = new Date(h.date);
      const diffTime = Math.abs(now.getTime() - recordDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days;
    });
    return {
      learned: filtered.reduce((acc, curr) => acc + curr.wordsLearned, 0),
      errors: filtered.reduce((acc, curr) => acc + curr.wrongCount, 0),
      sessions: filtered.length
    };
  };

  const renderWelcome = () => {
    const daily = getStatsForRange(1);
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="relative mb-8">
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border-8 border-yellow-400 p-4">
              <img src="https://picsum.photos/seed/star-main/200/200" alt="Xicheng Star" className="rounded-full w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-4 -right-4 bg-red-500 text-white font-cartoon text-lg px-4 py-1 rounded-full shadow-lg -rotate-12 border-4 border-white">
            西城专用
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-cartoon text-blue-600 mb-6 drop-shadow-md">西城英语小状元</h1>
        
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-blue-100 flex flex-col items-center">
             <span className="text-blue-500 text-sm font-bold">今日已学</span>
             <span className="text-2xl font-cartoon text-blue-800">{daily.learned} 词</span>
          </div>
          <button onClick={() => setView(AppView.STATS)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-6 py-4 rounded-3xl font-bold flex items-center space-x-2 transition">
             <span>📈 查看成长统计</span>
          </button>
        </div>

        <div className="mb-8 flex flex-col items-center space-y-3">
          <span className="font-bold text-blue-800 text-lg">设置目标: 每次背单词数量</span>
          <div className="flex space-x-2">
            {[5, 10, 15, 20].map(len => (
              <button
                key={len}
                onClick={() => setSessionLength(len)}
                className={`w-12 h-12 rounded-full font-bold transition flex items-center justify-center ${sessionLength === len ? 'bg-blue-500 text-white scale-110 shadow-lg' : 'bg-white text-blue-400 hover:bg-blue-50 shadow-sm'}`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
          <button onClick={() => setView(AppView.GRADE_SELECT)} className="bg-blue-600 hover:bg-blue-700 text-white font-cartoon text-3xl px-12 py-5 rounded-full shadow-2xl transition hover:scale-105 border-b-8 border-blue-800">开始挑战 🚀</button>
          <button onClick={() => setView(AppView.WRONG_BOOK)} className="bg-red-500 hover:bg-red-600 text-white font-cartoon text-3xl px-12 py-5 rounded-full shadow-2xl transition hover:scale-105 border-b-8 border-red-800">错题本 ({wrongWords.length})</button>
        </div>
      </div>
    );
  };

  const renderGradeSelect = () => (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <button onClick={() => setView(AppView.WELCOME)} className="bg-white p-3 rounded-full shadow-md text-blue-600 hover:scale-110 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h2 className="text-4xl font-cartoon text-blue-600">选择你的年级</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {GRADES.map(grade => (
          <GradeCard key={grade} grade={grade} isSelected={selectedGrade === grade} onClick={handleGradeSelect} />
        ))}
      </div>
    </div>
  );

  const renderQuiz = () => {
    const word = sessionWords[currentWordIndex];
    if (!word) return null;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-800 font-bold">闯关进度 {currentWordIndex + 1}/{sessionWords.length}</span>
            <div className="flex space-x-1">
               {Array.from({length: sessionWords.length}).map((_, i) => (
                 <div key={i} className={`w-3 h-3 rounded-full ${i < currentWordIndex ? 'bg-green-400' : i === currentWordIndex ? 'bg-blue-400 animate-pulse' : 'bg-gray-200'}`}></div>
               ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center mb-6 gap-2">
           <button onClick={() => { setQuizMode('ENG_TO_CHI'); setQuizFeedback(null); }} className={`px-4 py-2 rounded-full font-bold transition ${quizMode === 'ENG_TO_CHI' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-400'}`}>看英选中</button>
           <button onClick={() => { setQuizMode('CHI_TO_ENG'); setQuizFeedback(null); }} className={`px-4 py-2 rounded-full font-bold transition ${quizMode === 'CHI_TO_ENG' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-400'}`}>看中拼英</button>
           <button onClick={() => { setQuizMode('VISUAL_TO_ENG'); setQuizFeedback(null); }} className={`px-4 py-2 rounded-full font-bold transition ${quizMode === 'VISUAL_TO_ENG' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-400'}`}>看图拼英 🎨</button>
        </div>

        <div className={`bg-white rounded-[3rem] shadow-2xl p-10 border-8 transition-all duration-300 transform ${quizFeedback === 'correct' ? 'border-green-400 scale-102' : quizFeedback === 'wrong' ? 'border-red-400' : 'border-blue-200'}`}>
          <div className="text-center mb-8">
            <h2 className="text-7xl md:text-8xl font-bold text-blue-800 mb-4">
              {quizMode === 'ENG_TO_CHI' ? word.english : quizMode === 'CHI_TO_ENG' ? word.chinese : (word.emoji || '❓')}
            </h2>
            {quizMode === 'ENG_TO_CHI' && <button onClick={() => speak(word.english)} className="text-blue-400 font-bold hover:scale-110 transition">🔊 点击听发音</button>}
          </div>

          {quizMode === 'ENG_TO_CHI' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {options.map((opt, i) => (
                <button
                  key={i}
                  disabled={quizFeedback !== null}
                  onClick={() => handleQuizAnswer(opt)}
                  className={`p-6 text-2xl font-bold rounded-3xl border-4 transition transform active:scale-95 ${quizFeedback === 'correct' && opt === word.chinese ? 'bg-green-100 border-green-400 text-green-700' : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'}`}
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
                placeholder="输入英文单词..."
                className="w-full max-w-md text-3xl font-bold p-6 border-4 border-blue-100 rounded-3xl text-center mb-6 focus:border-blue-500 outline-none shadow-inner"
              />
              <button
                onClick={() => handleQuizAnswer(userAnswer)}
                disabled={quizFeedback !== null}
                className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-cartoon text-2xl shadow-lg hover:bg-blue-700 transition active:scale-95"
              >
                提交验证
              </button>
            </div>
          )}

          {quizFeedback === 'wrong' && (
            <div className="mt-8 bg-red-50 p-6 rounded-3xl animate-fade-in border-2 border-red-200">
              <p className="text-red-500 font-bold text-xl text-center mb-4">哎呀，记错啦！别担心，我们再学一次：</p>
              <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-2xl">
                 <span className="text-3xl font-bold text-blue-800">{word.english}</span>
                 <span className="text-xl text-gray-500">{word.chinese}</span>
              </div>
              
              {explanation ? (
                <div className="bg-yellow-50 p-4 rounded-xl text-sm border-l-4 border-yellow-400">
                  <p className="mb-1">💡 <strong>解析:</strong> {explanation.meaning}</p>
                  <p className="italic">😂 <strong>趣闻:</strong> {explanation.funnySentence}</p>
                </div>
              ) : (
                <button onClick={handleAskAI} disabled={aiLoading} className="w-full bg-purple-100 text-purple-700 p-3 rounded-xl font-bold hover:bg-purple-200">
                  {aiLoading ? 'AI 正在解析...' : '✨ 看看 AI 老师的记忆法'}
                </button>
              )}
              
              <button 
                onClick={() => { setQuizFeedback(null); setUserAnswer(''); }} 
                className="mt-6 w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-xl shadow-md"
              >
                我记住啦，再次挑战！
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const daily = getStatsForRange(1);
    const weekly = getStatsForRange(7);
    const monthly = getStatsForRange(30);
    const all = getStatsForRange('all');

    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center space-x-4 mb-8">
           <button onClick={() => setView(AppView.WELCOME)} className="bg-white p-3 rounded-full shadow-md text-blue-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
           <h2 className="text-4xl font-cartoon text-blue-600">成长记录 📊</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: '今日学习', data: daily, color: 'bg-blue-500' },
            { label: '本周学习', data: weekly, color: 'bg-green-500' },
            { label: '本月学习', data: monthly, color: 'bg-purple-500' },
            { label: '全部挑战', data: all, color: 'bg-orange-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl shadow-xl p-8 border-t-8 border-blue-100">
               <h3 className={`text-2xl font-cartoon mb-4 ${stat.color.replace('bg-', 'text-')}`}>{stat.label}</h3>
               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">掌握单词</p>
                    <p className="text-4xl font-bold text-gray-800">{stat.data.learned}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">错误次数</p>
                    <p className="text-2xl font-bold text-red-400">{stat.data.errors}</p>
                  </div>
               </div>
               <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-400">完成 {stat.data.sessions} 场挑战</span>
                  <div className={`h-2 rounded-full ${stat.color} w-1/2`}></div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWrongBook = () => (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setView(AppView.WELCOME)} className="bg-white p-3 rounded-full shadow-md text-blue-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h2 className="text-4xl font-cartoon text-red-600">我的错题本 📚</h2>
        <button onClick={startWrongBookSession} disabled={wrongWords.length === 0} className="bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg disabled:opacity-50 hover:bg-green-600">开始复习复习</button>
      </div>
      
      {wrongWords.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] shadow-inner border-4 border-dashed border-gray-100">
           <p className="text-gray-400 text-2xl font-bold">还没有错题哦，你是单词小达人！🌟</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wrongWords.map(w => (
            <div key={w.id} className="bg-white p-6 rounded-3xl shadow-md border-4 border-red-50 relative group hover:border-red-200 transition">
              <div className="absolute top-4 right-4 flex space-x-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full shadow-sm ${w.consecutiveCorrectCount >= i ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                ))}
              </div>
              <h4 className="text-3xl font-bold text-gray-800">{w.english}</h4>
              <p className="text-gray-500 text-lg mb-2">{w.chinese}</p>
              <div className="bg-blue-50 text-blue-400 text-xs px-2 py-1 rounded inline-block font-bold">再对 {3 - w.consecutiveCorrectCount} 次可移除</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReport = () => {
    const accuracy = Math.round((correctInSession / (correctInSession + wrongInSession)) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-[4rem] shadow-2xl p-12 border-8 border-yellow-400 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-yellow-400 to-green-400"></div>
          <div className="text-9xl mb-8 animate-bounce">🥇</div>
          <h2 className="text-5xl font-cartoon text-blue-600 mb-6">挑战大成功！</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-10">
             <div className="bg-blue-50 p-6 rounded-3xl">
                <p className="text-gray-400 text-sm">学习数量</p>
                <p className="text-4xl font-cartoon text-blue-600">{sessionWords.length}</p>
             </div>
             <div className="bg-green-50 p-6 rounded-3xl">
                <p className="text-gray-400 text-sm">正确率</p>
                <p className="text-4xl font-cartoon text-green-600">{accuracy}%</p>
             </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-3xl mb-10 text-left border-2 border-yellow-200">
             <h4 className="font-bold text-yellow-800 mb-4 flex items-center">
               <span className="mr-2">📝</span> 本次总结:
             </h4>
             <p className="text-gray-700 leading-relaxed">
               你在本次练习中表现出色！
               {accuracy >= 90 ? '你的词汇量非常扎实，简直是英语天才！' : 
                accuracy >= 70 ? '表现很稳健，继续加油你会更棒！' : 
                '虽然遇到了一些困难，但每一次错误都是成长的机会，错题已经帮你存入本子啦。'}
             </p>
          </div>

          <div className="flex flex-col space-y-4">
             <button onClick={() => startSession(selectedGrade || 1, sessionLength)} className="w-full bg-blue-600 text-white font-cartoon text-3xl py-5 rounded-3xl shadow-xl hover:scale-102 transition border-b-8 border-blue-800">再战一场</button>
             <button onClick={() => setView(AppView.WELCOME)} className="w-full bg-gray-100 text-gray-600 font-cartoon text-2xl py-4 rounded-3xl hover:bg-gray-200 transition">回到大厅</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative pb-20">
      <div className="blob -top-20 -left-20"></div>
      <div className="blob top-1/2 -right-20 opacity-50"></div>
      
      <header className="sticky top-0 z-50 bg-white bg-opacity-80 backdrop-blur-md px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView(AppView.WELCOME)}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-cartoon text-2xl shadow-lg transform rotate-6">X</div>
          <span className="text-xl font-cartoon text-blue-800">西城小状元</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-1.5 rounded-full shadow-inner border flex items-center space-x-2">
             <span className="text-red-500 font-bold">📕 {wrongWords.length}</span>
             <div className="w-px h-4 bg-gray-200"></div>
             <span className="text-yellow-500 font-bold">⭐ {learningHistory.reduce((a,b)=>a+b.wordsLearned,0)}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl">
        {view === AppView.WELCOME && renderWelcome()}
        {view === AppView.GRADE_SELECT && renderGradeSelect()}
        {view === AppView.QUIZ && renderQuiz()}
        {view === AppView.REPORT && renderReport()}
        {view === AppView.WRONG_BOOK && renderWrongBook()}
        {view === AppView.STATS && renderStats()}
      </main>

      <style>{`
        @keyframes bounce-slow { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
        .animate-bounce-slow { animation: bounce-slow 3s infinite; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .scale-102 { transform: scale(1.02); }
      `}</style>
    </div>
  );
};

export default App;
