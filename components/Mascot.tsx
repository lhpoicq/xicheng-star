
import React from 'react';

interface MascotProps {
  message: string;
}

const Mascot: React.FC<MascotProps> = ({ message }) => {
  return (
    <div className="flex items-center space-x-4 animate-bounce-slow">
      <div className="relative">
        <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
            <img src="https://picsum.photos/seed/star-mascot/150/150" alt="Mascot" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 border-2 border-white font-bold">
          Hi!
        </div>
      </div>
      <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-md border-2 border-blue-100 max-w-xs relative">
        <p className="text-blue-800 text-sm font-bold">{message}</p>
        <div className="absolute bottom-0 -left-2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-white border-b-[8px] border-b-transparent"></div>
      </div>
    </div>
  );
};

export default Mascot;
