
import React, { useState, useEffect } from 'react';
import { AppView, Word, AIExplanation, WrongWord, QuizMode, HistoryRecord, UserAccount, UserProgress } from './types.ts';
import { GRADES, MOCK_WORDS } from './constants.ts';
import GradeCard from './components/GradeCard.tsx';
import Mascot from './components/Mascot.tsx';
import { getWordExplanation } from './services/geminiService.ts';

const App: React.FC = () => {
  // --- 用户系统状态 ---
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });

  // --- 学习进度状态 ---
  const [view, setView] = useState<AppView>(AppView.LOGIN);
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

  // 初始化加载所有账号
  useEffect(() => {
    const savedUsers = localStorage.getItem('xicheng_users');
    let users: UserAccount[] = [];
    if (savedUsers) {
      users = JSON.parse(savedUsers);
    } else {
      // 默认管理员
      users = [{
        username: 'admin',
        password: '123456',
        role: 'admin',
        progress: { testedWordIds: [], wrongWords: [], learningHistory: [] }
      }];
      localStorage.setItem('xicheng_users', JSON.stringify(users));
    }
    setAllUsers(users);

    const sessionUser = sessionStorage.getItem('xicheng_current_session');
    if (sessionUser) {
      const user = JSON.parse(sessionUser);
      setCurrentUser(user);
      setView(AppView.WELCOME);
    }
  }, []);

  // 单词选项生成
  useEffect(() => {
    if (view === AppView.QUIZ && sessionWords.length > 0 && currentWordIndex < sessionWords.length && quizMode === 'ENG_TO_CHI') {
      const currentWord = sessionWords[currentWordIndex];
      const otherWords = MOCK_WORDS.filter(w => w.chinese !== currentWord.chinese);
      const distractors = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.chinese);
      const allOptions = [...distractors, currentWord.chinese].sort(() => 0.5 - Math.random());
      setOptions(allOptions);
    }
  }, [view, currentWordIndex, sessionWords, quizMode]);

  // 更新当前用户的进度到“数据库”
  const saveProgress = (updatedProgress: Partial<UserProgress>) => {
    if (!currentUser) return;
    const newProgress = { ...currentUser.progress, ...updatedProgress };
    const newUser = { ...currentUser, progress: newProgress };
    
    // 更新当前会话
    setCurrentUser(newUser);
    sessionStorage.setItem('xicheng_current_session', JSON.stringify(newUser));

    // 更新全局用户列表
    const updatedAllUsers = allUsers.map(u => u.username === currentUser.username ? newUser : u);
    setAllUsers(updatedAllUsers);
    localStorage.setItem('xicheng_users', JSON.stringify(updatedAllUsers));
  };

  // --- Auth 逻辑 ---
  const handleLogin = () => {
    const user = allUsers.find(u => u.username === authForm.username && u.password === authForm.password);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('xicheng_current_session', JSON.stringify(user));
      setView(AppView.WELCOME);
      setAuthForm({ username: '', password: '' });
    } else {
      alert('用户名或密码错误！');
    }
  };

  const handleRegister = () => {
    if (allUsers.find(u => u.username === authForm.username)) {
      alert('用户名已存在！');
      return;
    }
    const newUser: UserAccount = {
      username: authForm.username,
      password: authForm.password,
      role: 'user',
      progress: { testedWordIds: [], wrongWords: [], learningHistory: [] }
    };
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem('xicheng_users', JSON.stringify(updatedUsers));
    alert('注册成功，请登录！');
    setView(AppView.LOGIN);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('xicheng_current_session');
    setView(AppView.LOGIN);
  };

  const deleteUser = (username: string) => {
    if (username === 'admin') return;
    if (confirm(`确定要删除用户 ${username} 吗？`)) {
      const updated = allUsers.filter(u => u.username !== username);
      setAllUsers(updated);
      localStorage.setItem('xicheng_users', JSON.stringify(updated));
    }
  };

  // --- 业务逻辑 ---
  const speak = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) { console.error(e); }
  };

  const startSession = (grade: number, unit: number | 'all', mode: QuizMode, length: number | 'all') => {
    if (!currentUser) return;
    let pool = MOCK_WORDS.filter(w => w.grade === grade);
    if (unit !== 'all') pool = pool.filter(w => w.unit === unit);

    let availableWords = pool.filter(w => !currentUser.progress.testedWordIds.includes(w.id));
    if (availableWords.length === 0) {
      const wordIdsInPool = pool.map(w => w.id);
      saveProgress({ testedWordIds: currentUser.progress.testedWordIds.filter(id => !wordIdsInPool.includes(id)) });
      availableWords = pool;
    }
    
    const shuffledPool = [...availableWords].sort(() => 0.5 - Math.random());
    const finalWords = length === 'all' ? shuffledPool : shuffledPool.slice(0, length);
    
    if (finalWords.length === 0) {
       alert("该单元暂无词汇。");
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

  const handleQuizAnswer = (answer: string) => {
    if (quizFeedback !== null || !currentUser) return;
    const currentWord = sessionWords[currentWordIndex];
    const isCorrect = quizMode === 'ENG_TO_CHI' 
      ? answer === currentWord.chinese 
      : answer.toLowerCase().trim() === currentWord.english.toLowerCase().trim();

    if (isCorrect) {
      setQuizFeedback('correct');
      setCorrectInSession(prev => prev + 1);
      speak(currentWord.english);
      
      const newTestedIds = Array.from(new Set([...currentUser.progress.testedWordIds, currentWord.id]));
      let newWrongWords = [...currentUser.progress.wrongWords];
      
      const existingInWrong = newWrongWords.find(w => w.id === currentWord.id);
      if (existingInWrong) {
        const newCount = existingInWrong.consecutiveCorrectCount + 1;
        if (newCount >= 3) {
          newWrongWords = newWrongWords.filter(w => w.id !== currentWord.id);
        } else {
          newWrongWords = newWrongWords.map(w => w.id === currentWord.id ? { ...w, consecutiveCorrectCount: newCount } : w);
        }
      }
      
      saveProgress({ testedWordIds: newTestedIds, wrongWords: newWrongWords });
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
          saveProgress({ learningHistory: [...currentUser.progress.learningHistory, newRecord] });
          setView(AppView.REPORT);
        }
      }, 800);
    } else {
      setQuizFeedback('wrong');
      setWrongInSession(prev => prev + 1);
      
      const newWrongWords = [...currentUser.progress.wrongWords];
      const existing = newWrongWords.find(w => w.id === currentWord.id);
      if (existing) {
        saveProgress({ wrongWords: newWrongWords.map(w => w.id === currentWord.id ? { ...w, consecutiveCorrectCount: 0 } : w) });
      } else {
        saveProgress({ wrongWords: [...newWrongWords, { ...currentWord, consecutiveCorrectCount: 0 }] });
      }

      setAiLoading(true);
      getWordExplanation(currentWord.english, selectedGrade || 1).then(res => {
        setExplanation(res);
        setAiLoading(false);
      });
    }
  };

  // --- 视图渲染函数 ---
  const renderAuth = (isLogin: boolean) => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-blue-100 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-3xl font-cartoon text-blue-600">{isLogin ? '欢迎回来' : '加入小状元'}</h2>
        </div>
        <div className="space-y-6">
          <input 
            type="text" 
            placeholder="用户名" 
            className="w-full p-4 rounded-2xl border-4 border-blue-50 focus:border-blue-400 outline-none text-xl font-bold"
            value={authForm.username}
            onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
          />
          <input 
            type="password" 
            placeholder="密码" 
            className="w-full p-4 rounded-2xl border-4 border-blue-50 focus:border-blue-400 outline-none text-xl font-bold"
            value={authForm.password}
            onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
          />
          <button 
            onClick={isLogin ? handleLogin : handleRegister}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-cartoon text-2xl shadow-xl border-b-8 border-blue-900 active:translate-y-2 active:border-b-0 transition-all"
          >
            {isLogin ? '立即登录' : '立即注册'}
          </button>
          <button 
            onClick={() => setView(isLogin ? AppView.REGISTER : AppView.LOGIN)}
            className="w-full text-blue-400 font-bold hover:text-blue-600 transition"
          >
            {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-cartoon text-blue-600">管理中心</h2>
        <button onClick={() => setView(AppView.WELCOME)} className="bg-gray-100 px-6 py-2 rounded-full font-bold">返回</button>
      </div>
      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border-4 border-blue-50">
        <table className="w-full text-left">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-6 font-cartoon text-xl text-blue-600">用户名</th>
              <th className="p-6 font-cartoon text-xl text-blue-600">已背单词</th>
              <th className="p-6 font-cartoon text-xl text-blue-600">错题数</th>
              <th className="p-6 font-cartoon text-xl text-blue-600">角色</th>
              <th className="p-6 font-cartoon text-xl text-blue-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map(u => (
              <tr key={u.username} className="border-t border-gray-100 hover:bg-gray-50 transition">
                <td className="p-6 font-bold text-gray-700">{u.username}</td>
                <td className="p-6 font-bold text-green-500">{u.progress.testedWordIds.length}</td>
                <td className="p-6 font-bold text-red-500">{u.progress.wrongWords.length}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-6">
                  {u.username !== 'admin' && (
                    <button onClick={() => deleteUser(u.username)} className="text-red-400 hover:text-red-600 font-bold">删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative pb-20 overflow-x-hidden">
      <div className="blob -top-20 -left-20"></div>
      <div className="blob top-1/2 -right-20 opacity-50"></div>
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-8 py-5 flex justify-between items-center shadow-sm border-b border-blue-50">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => currentUser && setView(AppView.WELCOME)}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-cartoon text-3xl shadow-lg transform rotate-6">★</div>
          <span className="text-2xl font-cartoon text-blue-800">西城小状元</span>
        </div>
        
        {currentUser && (
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-3 bg-white px-4 py-2 rounded-full shadow-sm border">
               <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
               <span className="font-bold text-blue-800">同学: {currentUser.username}</span>
            </div>
            {currentUser.role === 'admin' && (
              <button onClick={() => setView(AppView.ADMIN)} className="text-purple-600 font-bold hover:underline">管理</button>
            )}
            <button onClick={handleLogout} className="text-gray-400 font-bold hover:text-red-500 transition">退出</button>
          </div>
        )}
      </header>

      <main className="container mx-auto max-w-7xl pt-8">
        {view === AppView.LOGIN && renderAuth(true)}
        {view === AppView.REGISTER && renderAuth(false)}
        {view === AppView.ADMIN && renderAdmin()}
        
        {currentUser && (
          <>
            {view === AppView.WELCOME && (
              <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 animate-fade-in">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border-8 border-yellow-400 p-4 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.username}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                </div>
                <h1 className="text-5xl md:text-7xl font-cartoon text-blue-600 mb-6 drop-shadow-md">欢迎，{currentUser.username}！</h1>
                <div className="mb-10 flex flex-col items-center space-y-4">
                  <div className="bg-white px-8 py-3 rounded-full shadow-sm border border-blue-50">
                     <span className="text-blue-800 font-bold">已过关: {currentUser.progress.testedWordIds.length} | 错题: {currentUser.progress.wrongWords.length}</span>
                  </div>
                  <div className="flex bg-white p-2 rounded-full shadow-inner border mt-4">
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
                  <button onClick={() => setView(AppView.WRONG_BOOK)} className="bg-red-500 hover:bg-red-600 text-white font-cartoon text-3xl px-14 py-6 rounded-full shadow-2xl transition hover:scale-105 border-b-8 border-red-900">错题本</button>
                </div>
              </div>
            )}
            
            {view === AppView.GRADE_SELECT && (
              <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
                <h2 className="text-4xl font-cartoon text-blue-600 mb-12">选择年级</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {GRADES.map(grade => (
                    <GradeCard key={grade} grade={grade} isSelected={selectedGrade === grade} onClick={(g) => { setSelectedGrade(g); setView(AppView.UNIT_SELECT); }} />
                  ))}
                </div>
              </div>
            )}

            {view === AppView.UNIT_SELECT && (
              <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in text-center pb-32">
                <h2 className="text-4xl font-cartoon text-blue-600 mb-12">{selectedGrade}年级 - 选择单元</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  <button 
                    onClick={() => setSelectedUnit('all')}
                    className={`p-8 rounded-[2rem] font-cartoon text-3xl shadow-lg border-4 ${selectedUnit === 'all' ? 'bg-blue-600 text-white border-yellow-400' : 'bg-white'}`}
                  >全部单词</button>
                  {[0,1,2,3,4,5,6].map(unit => (
                    <button 
                      key={unit}
                      onClick={() => setSelectedUnit(unit)}
                      className={`p-8 rounded-[2rem] font-cartoon text-3xl shadow-md border-4 ${selectedUnit === unit ? 'bg-blue-600 text-white border-yellow-400' : 'bg-white'}`}
                    >{unit === 0 ? 'Welcome' : `Unit ${unit}`}</button>
                  ))}
                </div>
                {selectedUnit !== null && (
                   <button onClick={() => setView(AppView.MODE_SELECT)} className="bg-green-500 text-white font-cartoon text-4xl px-20 py-6 rounded-full shadow-2xl">下一步 🚀</button>
                )}
              </div>
            )}

            {view === AppView.MODE_SELECT && (
              <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in text-center">
                <h2 className="text-4xl font-cartoon text-blue-600 mb-12">挑战模式</h2>
                <div className="grid grid-cols-1 gap-6">
                  <button onClick={() => startSession(selectedGrade!, selectedUnit!, 'ENG_TO_CHI', sessionLength)} className="bg-white p-10 rounded-[3rem] shadow-xl border-4 border-blue-100 font-cartoon text-3xl text-blue-800">🔍 看英选意</button>
                  <button onClick={() => startSession(selectedGrade!, selectedUnit!, 'CHI_TO_ENG', sessionLength)} className="bg-white p-10 rounded-[3rem] shadow-xl border-4 border-green-100 font-cartoon text-3xl text-green-800">✍️ 看中拼英</button>
                </div>
              </div>
            )}

            {view === AppView.QUIZ && sessionWords[currentWordIndex] && (
              <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
                <div className="w-full bg-gray-200 h-4 rounded-full mb-8 overflow-hidden"><div className="bg-blue-500 h-full transition-all" style={{ width: `${((currentWordIndex + 1) / sessionWords.length) * 100}%` }}></div></div>
                <div className={`bg-white rounded-[3.5rem] shadow-2xl p-12 border-8 ${quizFeedback === 'correct' ? 'border-green-400' : quizFeedback === 'wrong' ? 'border-red-400' : 'border-blue-100'}`}>
                  <div className="text-center mb-10">
                    <h2 className="text-7xl font-bold text-blue-900 mb-6">{quizMode === 'ENG_TO_CHI' ? sessionWords[currentWordIndex].english : sessionWords[currentWordIndex].chinese}</h2>
                    <button onClick={() => speak(sessionWords[currentWordIndex].english)} className="bg-blue-50 p-4 rounded-full text-blue-500 text-2xl">🔊</button>
                  </div>
                  {quizMode === 'ENG_TO_CHI' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {options.map((opt, i) => (
                        <button key={i} disabled={quizFeedback !== null} onClick={() => handleQuizAnswer(opt)} className={`p-6 text-2xl font-bold rounded-3xl border-4 ${quizFeedback === 'correct' && opt === sessionWords[currentWordIndex].chinese ? 'bg-green-100 border-green-500' : 'bg-gray-50'}`}>{opt}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <input type="text" autoFocus disabled={quizFeedback !== null} value={userAnswer} onChange={e => setUserAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuizAnswer(userAnswer)} className="w-full p-6 text-4xl text-center border-4 rounded-3xl border-blue-100 outline-none focus:border-blue-500 mb-8" />
                      {quizFeedback === 'wrong' && <p className="text-red-600 text-3xl font-bold">正确拼写：{sessionWords[currentWordIndex].english}</p>}
                    </div>
                  )}
                  {quizFeedback === 'wrong' && (
                    <div className="mt-8 p-6 bg-yellow-50 rounded-3xl border-2 border-yellow-200">
                      {aiLoading ? <p className="animate-pulse">✨ AI老师思考中...</p> : explanation && <p className="text-gray-800 italic">💡 {explanation.mnemonic}</p>}
                      <button onClick={() => { setCurrentWordIndex(idx => idx + 1 < sessionWords.length ? idx + 1 : idx); if(currentWordIndex === sessionWords.length-1) setView(AppView.REPORT); setQuizFeedback(null); setUserAnswer(''); }} className="mt-4 bg-blue-500 text-white px-8 py-3 rounded-full">继续闯关</button>
                    </div>
                  )}
                  <div className="mt-10 flex justify-center"><Mascot message={quizFeedback === 'correct' ? '真棒！' : quizFeedback === 'wrong' ? '加油！' : '准备好了吗？'} /></div>
                </div>
              </div>
            )}

            {view === AppView.REPORT && (
              <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
                <div className="bg-white rounded-[4rem] shadow-2xl p-16 border-8 border-yellow-400">
                  <div className="text-9xl mb-10">🎖️</div>
                  <h2 className="text-5xl font-cartoon text-blue-600 mb-8">闯关大成功！</h2>
                  <button onClick={() => setView(AppView.WELCOME)} className="bg-blue-600 text-white px-16 py-6 rounded-full text-3xl font-cartoon shadow-xl">回到首页</button>
                </div>
              </div>
            )}

            {view === AppView.WRONG_BOOK && (
              <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
                <h2 className="text-4xl font-cartoon text-red-600 mb-12">我的错题本</h2>
                {currentUser.progress.wrongWords.length === 0 ? (
                  <div className="text-center p-20 bg-white rounded-3xl border-4 border-dashed border-gray-100 text-2xl text-gray-400">目前还没有错题哦！</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentUser.progress.wrongWords.map(w => (
                      <div key={w.id} className="bg-white p-8 rounded-3xl shadow-md border-l-8 border-red-400">
                        <h4 className="text-3xl font-bold mb-2">{w.english}</h4>
                        <p className="text-gray-500 text-xl">{w.chinese}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
