
import React from 'react';

interface GradeCardProps {
  grade: number;
  isSelected: boolean;
  onClick: (grade: number) => void;
}

const GradeCard: React.FC<GradeCardProps> = ({ grade, isSelected, onClick }) => {
  const colors = [
    'bg-pink-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-yellow-400',
    'bg-orange-400',
    'bg-purple-400'
  ];

  return (
    <button
      onClick={() => onClick(grade)}
      className={`
        relative overflow-hidden group p-6 rounded-3xl border-4 transition-all duration-300
        ${isSelected ? 'border-blue-600 scale-105 shadow-2xl' : 'border-white hover:scale-102 hover:shadow-xl'}
        ${colors[grade - 1]}
      `}
    >
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
        <span className="text-6xl font-cartoon text-white">{grade}</span>
      </div>
      <h3 className="text-2xl font-cartoon text-white mb-2 text-left">{grade} 年级</h3>
      <p className="text-white text-opacity-90 text-sm text-left font-medium">
        西城名校同步词库
      </p>
      <div className="mt-4 flex justify-between items-end">
        <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        </div>
        <span className="text-white font-bold bg-black bg-opacity-20 px-3 py-1 rounded-full text-xs">
          开始闯关
        </span>
      </div>
    </button>
  );
};

export default GradeCard;
