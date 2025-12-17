import React, { useState } from 'react';

interface ReferenceUploaderProps {
  onImageSelected: (base64: string | null) => void;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ onImageSelected }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onImageSelected(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onImageSelected(null);
  };

  return (
    <div className="w-full p-4 bg-white border-4 border-black pop-shadow rounded-lg">
      <h2 className="text-lg font-black uppercase mb-3 text-center">📸 上传参考图</h2>
      <p className="text-xs text-gray-600 mb-3 text-center">
        上传人物照片
      </p>
      
      <div className="flex flex-col items-center justify-center">
        {preview ? (
          <div className="relative w-full aspect-square mb-3 border-2 border-black overflow-hidden bg-gray-100 rounded">
             <img src={preview} alt="Reference" className="w-full h-full object-cover" />
             <button
               onClick={handleClear}
               className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 text-xs font-bold rounded-full border-2 border-black hover:bg-red-600 flex items-center justify-center"
               aria-label="Remove image"
             >
               ✕
             </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-black border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-4 pb-4">
              <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <p className="mb-1 text-xs text-gray-600 font-bold">点击上传图片</p>
              <p className="text-[10px] text-gray-500">PNG/JPG</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};

export default ReferenceUploader;
