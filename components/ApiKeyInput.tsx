
import React, { useState, useEffect } from 'react';

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySubmit }) => {
  const [key, setKey] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setKey(savedKey);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim().length > 0) {
      localStorage.setItem('gemini_api_key', key.trim());
      onKeySubmit(key.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pop-art p-4">
      <div className="bg-white border-4 border-black p-8 rounded-lg pop-shadow max-w-md w-full text-center">
        <h1 className="text-3xl font-black italic uppercase mb-6 text-stroke tracking-tighter">
          Gemini 表情包<span className="text-yellow-400">工场</span>
        </h1>
        
        <p className="text-gray-600 mb-6 font-bold">
          请在下方输入您的 Google Gemini API Key 以开始使用。
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="输入 API Key (AIza...)"
            className="w-full p-4 border-2 border-black rounded bg-gray-50 font-mono text-sm focus:outline-none focus:bg-yellow-50 focus:border-blue-500 transition-colors"
          />
          
          <button
            type="submit"
            disabled={!key}
            className={`
              w-full py-4 font-black uppercase tracking-wider border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-[2px] active:shadow-none transition-all
              ${!key ? 'bg-gray-200 text-gray-400' : 'bg-blue-500 text-white hover:bg-blue-600'}
            `}
          >
            🚀 开始生成
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500 font-bold">
          <p className="mb-2">没有 Key?</p>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            🔑 去 Google AI Studio 获取免费 Key
          </a>
        </div>
        
        <p className="mt-4 text-[10px] text-gray-400">
          您的 Key 仅储存在本地浏览器中，不会上传到任何中间服务器。
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInput;
