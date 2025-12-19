
import { Word } from './types.ts';

export const GRADES = [1, 2, 3, 4, 5, 6];

export const MOCK_WORDS: Word[] = [
  // Grade 1: Numbers, Colors, Family, Body
  { id: '1-1', english: 'one', chinese: '一', phonetic: '/wʌn/', grade: 1, unit: 1, emoji: '1️⃣' },
  { id: '1-2', english: 'two', chinese: '二', phonetic: '/tuː/', grade: 1, unit: 1, emoji: '2️⃣' },
  { id: '1-3', english: 'three', chinese: '三', phonetic: '/θriː/', grade: 1, unit: 1, emoji: '3️⃣' },
  { id: '1-4', english: 'red', chinese: '红色', phonetic: '/red/', grade: 1, unit: 2, emoji: '🔴' },
  { id: '1-5', english: 'blue', chinese: '蓝色', phonetic: '/bluː/', grade: 1, unit: 2, emoji: '🔵' },
  { id: '1-6', english: 'yellow', chinese: '黄色', phonetic: '/ˈjeləʊ/', grade: 1, unit: 2, emoji: '🟡' },
  { id: '1-7', english: 'dad', chinese: '爸爸', phonetic: '/dæd/', grade: 1, unit: 3, emoji: '👨' },
  { id: '1-8', english: 'mom', chinese: '妈妈', phonetic: '/mɒm/', grade: 1, unit: 3, emoji: '👩' },
  { id: '1-9', english: 'nose', chinese: '鼻子', phonetic: '/nəʊz/', grade: 1, unit: 4, emoji: '👃' },
  { id: '1-10', english: 'eye', chinese: '眼睛', phonetic: '/aɪ/', grade: 1, unit: 4, emoji: '👁️' },
  { id: '1-11', english: 'mouth', chinese: '嘴巴', phonetic: '/maʊθ/', grade: 1, unit: 4, emoji: '👄' },
  { id: '1-12', english: 'apple', chinese: '苹果', phonetic: '/ˈæpl/', grade: 1, unit: 5, emoji: '🍎' },
  { id: '1-13', english: 'banana', chinese: '香蕉', phonetic: '/bəˈnɑːnə/', grade: 1, unit: 5, emoji: '🍌' },
  { id: '1-14', english: 'cat', chinese: '猫', phonetic: '/kæt/', grade: 1, unit: 6, emoji: '🐱' },
  { id: '1-15', english: 'dog', chinese: '狗', phonetic: '/dɒɡ/', grade: 1, unit: 6, emoji: '🐶' },
  { id: '1-16', english: 'bird', chinese: '鸟', phonetic: '/bɜːd/', grade: 1, unit: 6, emoji: '🐦' },

  // Grade 2: Food, Animals, Daily objects, Actions
  { id: '2-1', english: 'milk', chinese: '牛奶', phonetic: '/mɪlk/', grade: 2, unit: 1, emoji: '🥛' },
  { id: '2-2', english: 'bread', chinese: '面包', phonetic: '/bred/', grade: 2, unit: 1, emoji: '🍞' },
  { id: '2-3', english: 'water', chinese: '水', phonetic: '/ˈwɔːtə(r)/', grade: 2, unit: 1, emoji: '💧' },
  { id: '2-4', english: 'rabbit', chinese: '兔子', phonetic: '/ˈræbɪt/', grade: 2, unit: 2, emoji: '🐰' },
  { id: '2-5', english: 'tiger', chinese: '老虎', phonetic: '/ˈtaɪɡə(r)/', grade: 2, unit: 2, emoji: '🐯' },
  { id: '2-6', english: 'bag', chinese: '包', phonetic: '/bæɡ/', grade: 2, unit: 3, emoji: '🎒' },
  { id: '2-7', english: 'book', chinese: '书', phonetic: '/bʊk/', grade: 2, unit: 3, emoji: '📖' },
  { id: '2-8', english: 'run', chinese: '跑', phonetic: '/rʌn/', grade: 2, unit: 4, emoji: '🏃' },
  { id: '2-9', english: 'jump', chinese: '跳', phonetic: '/dʒʌmp/', grade: 2, unit: 4, emoji: '🦘' },
  { id: '2-10', english: 'sing', chinese: '唱', phonetic: '/sɪŋ/', grade: 2, unit: 4, emoji: '🎤' },

  // Grade 3: Classroom, Home, Feelings, Weather
  { id: '3-1', english: 'school', chinese: '学校', phonetic: '/skuːl/', grade: 3, unit: 1, emoji: '🏫' },
  { id: '3-2', english: 'teacher', chinese: '老师', phonetic: '/ˈtiːtʃə(r)/', grade: 3, unit: 1, emoji: '👩‍🏫' },
  { id: '3-3', english: 'desk', chinese: '书桌', phonetic: '/desk/', grade: 3, unit: 2, emoji: ' desks ' },
  { id: '3-4', english: 'chair', chinese: '椅子', phonetic: '/tʃeə(r)/', grade: 3, unit: 2, emoji: '🪑' },
  { id: '3-5', english: 'happy', chinese: '开心的', phonetic: '/ˈhæpi/', grade: 3, unit: 3, emoji: '😊' },
  { id: '3-6', english: 'sad', chinese: '难过的', phonetic: '/sæd/', grade: 3, unit: 3, emoji: '😢' },
  { id: '3-7', english: 'sunny', chinese: '晴朗的', phonetic: '/ˈsʌni/', grade: 3, unit: 4, emoji: '☀️' },
  { id: '3-8', english: 'rainy', chinese: '下雨的', phonetic: '/ˈreɪni/', grade: 3, unit: 4, emoji: '🌧️' },
  { id: '3-9', english: 'winter', chinese: '冬天', phonetic: '/ˈwɪntə(r)/', grade: 3, unit: 5, emoji: '❄️' },
  { id: '3-10', english: 'summer', chinese: '夏天', phonetic: '/ˈsʌmə(r)/', grade: 3, unit: 5, emoji: '🏖️' },

  // Grade 4: Hobbies, Jobs, Transportation, Time
  { id: '4-1', english: 'football', chinese: '足球', phonetic: '/ˈfʊtbɔːl/', grade: 4, unit: 1, emoji: '⚽' },
  { id: '4-2', english: 'swimming', chinese: '游泳', phonetic: '/ˈswɪmɪŋ/', grade: 4, unit: 1, emoji: '🏊' },
  { id: '4-3', english: 'doctor', chinese: '医生', phonetic: '/ˈdɒktə(r)/', grade: 4, unit: 2, emoji: '🩺' },
  { id: '4-4', english: 'nurse', chinese: '护士', phonetic: '/nɜːs/', grade: 4, unit: 2, emoji: '👩‍⚕️' },
  { id: '4-5', english: 'bus', chinese: '公交车', phonetic: '/bʌs/', grade: 4, unit: 3, emoji: '🚌' },
  { id: '4-6', english: 'plane', chinese: '飞机', phonetic: '/pleɪn/', grade: 4, unit: 3, emoji: '✈️' },
  { id: '4-7', english: 'morning', chinese: '早上', phonetic: '/ˈmɔːnɪŋ/', grade: 4, unit: 4, emoji: '🌅' },
  { id: '4-8', english: 'evening', chinese: '晚上', phonetic: '/ˈiːvnɪŋ/', grade: 4, unit: 4, emoji: '🌃' },
  { id: '4-9', english: 'breakfast', chinese: '早餐', phonetic: '/ˈbrekfəst/', grade: 4, unit: 5, emoji: '🍳' },
  { id: '4-10', english: 'dinner', chinese: '晚餐', phonetic: '/ˈdɪnə(r)/', grade: 4, unit: 5, emoji: '🍽️' },

  // Grade 5: Daily Routine, Seasons, Places, Nature
  { id: '5-1', english: 'spring', chinese: '春天', phonetic: '/sprɪŋ/', grade: 5, unit: 1, emoji: '🌱' },
  { id: '5-2', english: 'autumn', chinese: '秋天', phonetic: '/ˈɔːtəm/', grade: 5, unit: 1, emoji: '🍂' },
  { id: '5-3', english: 'mountain', chinese: '山', phonetic: '/ˈmaʊntən/', grade: 5, unit: 2, emoji: '⛰️' },
  { id: '5-4', english: 'river', chinese: '河流', phonetic: '/ˈrɪvə(r)/', grade: 5, unit: 2, emoji: '🌊' },
  { id: '5-5', english: 'library', chinese: '图书馆', phonetic: '/ˈlaɪbrəri/', grade: 5, unit: 3, emoji: '📚' },
  { id: '5-6', english: 'cinema', chinese: '电影院', phonetic: '/ˈsɪnəmə/', grade: 5, unit: 3, emoji: '🎬' },
  { id: '5-7', english: 'visit', chinese: '参观', phonetic: '/ˈvɪzɪt/', grade: 5, unit: 4, emoji: '🚶' },
  { id: '5-8', english: 'delicious', chinese: '美味的', phonetic: '/dɪˈlɪʃəs/', grade: 5, unit: 4, emoji: '😋' },
  { id: '5-9', english: 'forest', chinese: '森林', phonetic: '/ˈfɒrɪst/', grade: 5, unit: 5, emoji: '🌲' },
  { id: '5-10', english: 'bridge', chinese: '桥', phonetic: '/brɪdʒ/', grade: 5, unit: 5, emoji: '🌉' },

  // Grade 6: Advanced Concepts, History, Science
  { id: '6-1', english: 'environment', chinese: '环境', phonetic: '/ɪnˈvaɪrənmənt/', grade: 6, unit: 1, emoji: '🌍' },
  { id: '6-2', english: 'traditional', chinese: '传统的', phonetic: '/trəˈdɪʃənl/', grade: 6, unit: 1, emoji: '🏮' },
  { id: '6-3', english: 'experience', chinese: '经历', phonetic: '/ɪkˈspɪəriəns/', grade: 6, unit: 2, emoji: '🧗' },
  { id: '6-4', english: 'celebration', chinese: '庆祝', phonetic: '/ˌselɪˈbreɪʃn/', grade: 6, unit: 2, emoji: '🎉' },
  { id: '6-5', english: 'museum', chinese: '博物馆', phonetic: '/mjuˈziːəm/', grade: 6, unit: 3, emoji: '🏛️' },
  { id: '6-6', english: 'pollution', chinese: '污染', phonetic: '/pəˈluːʃn/', grade: 6, unit: 3, emoji: '🏭' },
  { id: '6-7', english: 'protection', chinese: '保护', phonetic: '/prəˈtekʃn/', grade: 6, unit: 4, emoji: '🛡️' },
  { id: '6-8', english: 'scientist', chinese: '科学家', phonetic: '/ˈsaɪəntɪst/', grade: 6, unit: 4, emoji: '🔬' },
  { id: '6-9', english: 'technology', chinese: '技术', phonetic: '/tekˈnɒlədʒi/', grade: 6, unit: 5, emoji: '💻' },
  { id: '6-10', english: 'future', chinese: '未来', phonetic: '/ˈfjuːtʃə(r)/', grade: 6, unit: 5, emoji: '🚀' },
  { id: '6-11', english: 'volunteer', chinese: '志愿者', phonetic: '/ˌvɒlənˈtɪə(r)/', grade: 6, unit: 6, emoji: '🤝' },
  { id: '6-12', english: 'adventure', chinese: '冒险', phonetic: '/ədˈventʃə(r)/', grade: 6, unit: 6, emoji: '🗺️' },
];
