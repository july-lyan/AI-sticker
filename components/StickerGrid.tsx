
import React from 'react';
import { GeneratedSticker, GenerationStatus, StickerPrompt } from '../types';

interface StickerGridProps {
  prompts: StickerPrompt[];
  generatedStickers: Record<string, GeneratedSticker>;
  onGenerate: (id: string, prompt: string) => void;
  onStickerClick: (sticker: GeneratedSticker, label: string) => void;
  isProcessing: boolean;
  hasApiKey: boolean;
  hasReference: boolean;
}

const StickerGrid: React.FC<StickerGridProps> = ({ 
  prompts,
  generatedStickers, 
  onGenerate, 
  onStickerClick,
  isProcessing,
  hasApiKey,
  hasReference
}) => {

  const handleInteraction = (e: React.MouseEvent, sticker: GeneratedSticker, label: string) => {
    e.stopPropagation();
    if (!sticker.url) return;
    
    // Check if mobile (touch device)
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // On mobile, trigger the parent's click handler (to open modal)
    // On desktop, we can still trigger the modal or just let the hover button handle download.
    // Here we make clicking the image ALWAYS open the modal for better viewing experience on all devices,
    // but we keep the hover button for quick download on desktop.
    onStickerClick(sticker, label);
  };

  const handleDownloadDirect = (e: React.MouseEvent, sticker: GeneratedSticker, label: string) => {
    e.stopPropagation();
    if (!sticker.url) return;

    const a = document.createElement('a');
    a.href = sticker.url;
    a.download = `sticker_${label}_${sticker.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full">
      {/* 2 columns on mobile, 3 on md and lg */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {prompts.map((sticker) => {
          const state = generatedStickers[sticker.id] || { status: GenerationStatus.IDLE, url: '', id: sticker.id };
          const isSuccess = state.status === GenerationStatus.SUCCESS;

          return (
            <div 
              key={sticker.id} 
              className="relative bg-white border-2 md:border-4 border-black rounded-lg overflow-hidden pop-shadow hover:translate-y-[-2px] transition-transform duration-200 flex flex-col"
            >
              {/* Card Header */}
              <div className="bg-yellow-300 border-b-2 md:border-b-4 border-black p-1 md:p-2 flex justify-between items-center">
                <span className="font-bold text-xs md:text-sm uppercase truncate flex-1">{sticker.label}</span>
                <span className="text-[10px] md:text-xs font-mono bg-black text-white px-1 rounded ml-1">#{sticker.id}</span>
              </div>

              {/* Card Body */}
              <div 
                 className="aspect-square w-full flex items-center justify-center relative p-2 group bg-white cursor-pointer"
                 onClick={(e) => isSuccess && handleInteraction(e, state, sticker.label)}
                 style={{ 
                   backgroundImage: `
                     linear-gradient(45deg, #cbd5e1 25%, transparent 25%), 
                     linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), 
                     linear-gradient(45deg, transparent 75%, #cbd5e1 75%), 
                     linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)
                   `,
                   backgroundSize: '20px 20px',
                   backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                 }}
              >
                {isSuccess && state.url ? (
                  <>
                    {/* The Image */}
                    <img 
                      src={state.url} 
                      alt={sticker.label} 
                      className="w-full h-full object-contain relative z-10 touch-auto select-none" 
                    />
                    
                    {/* Desktop Download Button - Visible on Hover */}
                    <button
                      onClick={(e) => handleDownloadDirect(e, state, sticker.label)}
                      className="hidden md:block absolute top-2 right-2 p-2 bg-white border-2 border-black rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 z-20"
                      title="下载单张图片"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    
                    {/* Mobile Hint (Subtle) */}
                    <div className="md:hidden absolute bottom-1 right-1 text-[8px] bg-black/50 text-white px-1 rounded pointer-events-none z-10">
                      点击查看
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    {state.status === GenerationStatus.GENERATING ? (
                      <div className="flex flex-col items-center animate-pulse">
                        <div className="w-8 h-8 border-4 border-black border-t-yellow-400 rounded-full animate-spin mb-2"></div>
                        <span className="text-xs font-bold text-gray-500">绘制中...</span>
                      </div>
                    ) : (
                       state.status === GenerationStatus.ERROR ? (
                        <div className="flex flex-col items-center text-red-500">
                           <span className="text-2xl mb-1">❌</span>
                           <span className="text-[10px] font-bold leading-tight">失败</span>
                           <button 
                             className="mt-2 text-[10px] underline"
                             onClick={(e) => {
                               e.stopPropagation();
                               onGenerate(sticker.id, sticker.prompt);
                             }}
                           >
                             重试
                           </button>
                        </div>
                       ) : (
                        <div className="flex flex-col items-center opacity-30">
                          <span className="text-2xl mb-1">🎨</span>
                          <span className="text-[10px] font-bold">待生成</span>
                        </div>
                       )
                    )}
                  </div>
                )}
              </div>
              
              {/* Card Footer: Actions (Regenerate) */}
              {isSuccess && !isProcessing && (
                <div className="border-t-2 md:border-t-4 border-black bg-gray-50 p-1 flex justify-center">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       onGenerate(sticker.id, sticker.prompt);
                     }}
                     className="text-[10px] md:text-xs font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 py-1 px-2 rounded hover:bg-gray-200 transition-colors"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                     重绘
                   </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StickerGrid;
