import React, { useState } from 'react';
import { getTexts } from '../i18n';

interface ReferenceUploaderProps {
  onImageSelected: (base64: string | null) => void;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ onImageSelected }) => {
  const texts = getTexts();
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  /**
   * 压缩图片到合理大小
   * 目标：base64 < 1MB，最大边不超过1024px
   */
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // 计算压缩后的尺寸
          let width = img.width;
          let height = img.height;
          const maxSize = 1024; // 最大边1024px

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          // 创建Canvas进行压缩
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法创建Canvas上下文'));
            return;
          }

          // 绘制并压缩
          ctx.drawImage(img, 0, 0, width, height);

          // 尝试不同的质量，确保base64 < 1MB
          let quality = 0.85;
          let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

          // 如果还是太大，降低质量
          while (compressedBase64.length > 1024 * 1024 && quality > 0.3) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          }

          const sizeInKB = Math.round(compressedBase64.length / 1024);
          console.log(
            `[图片压缩] 原始: ${Math.round(file.size / 1024)}KB → 压缩后: ${sizeInKB}KB (质量: ${Math.round(quality * 100)}%)`
          );

          resolve(compressedBase64);
        };

        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);

      // 压缩图片
      const compressedBase64 = await compressImage(file);

      setPreview(compressedBase64);
      onImageSelected(compressedBase64);
    } catch (error) {
      console.error('图片压缩失败:', error);
      alert('图片处理失败，请重试');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onImageSelected(null);
  };

  return (
    <div className="w-full p-4 bg-white border-4 border-black pop-shadow rounded-lg">
      <h2 className="text-lg font-black uppercase mb-3 text-center">{texts.uploadTitle}</h2>
      <p className="text-xs text-gray-600 mb-3 text-center">
        {texts.uploadSubtitle}
      </p>

      <div className="flex flex-col items-center justify-center">
        {isCompressing ? (
          <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-black border-dashed rounded-lg bg-blue-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2"></div>
            <p className="text-xs text-gray-600 font-bold">{texts.uploadCompressing}</p>
          </div>
        ) : preview ? (
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
              <p className="mb-1 text-xs text-gray-600 font-bold">{texts.uploadClick}</p>
              <p className="text-[10px] text-gray-500">{texts.uploadFormat}</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};

export default ReferenceUploader;
