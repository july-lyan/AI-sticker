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
    <div className="w-full max-w-md mx-auto mb-8 p-6 bg-white border-4 border-black pop-shadow rounded-lg">
      <h2 className="text-xl font-black uppercase italic mb-4 text-center">第一步：上传参考图</h2>
      <p className="text-sm text-gray-600 mb-4 text-center">
        上传您想制作成表情包的人物照片。
      </p>
      
      <div className="flex flex-col items-center justify-center">
        {preview ? (
          <div className="relative w-48 h-48 mb-4 border-2 border-black overflow-hidden bg-gray-100">
             <img src={preview} alt="Reference" className="w-full h-full object-cover" />
             <button 
               onClick={handleClear}
               className="absolute top-0 right-0 bg-red-500 text-white p-1 text-xs font-bold border-l-2 border-b-2 border-black hover:bg-red-600"
               aria-label="Remove image"
             >
               X
             </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-black border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-10 h-10 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <p className="mb-2 text-sm text-gray-500 font-bold">点击上传图片</p>
              <p className="text-xs text-gray-500">PNG, JPG (最大 5MB)</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};

export default ReferenceUploader;
