import React, { useState } from 'react';
import { GenerationStatus } from '../types';
import { getTexts, getCurrentLanguage } from '../i18n';

interface ReviewAsset {
  url: string;
  status: GenerationStatus;
}

interface WeChatReviewPanelProps {
  banner: ReviewAsset | null;
  cover: ReviewAsset | null;
  icon: ReviewAsset | null;
  isGenerating: boolean;
  progress: string;
  onGenerate: () => void;
  onDownloadAll: () => void;
  onDownloadSingle: (type: 'banner' | 'cover' | 'icon') => void;
  hasCharacterDNA: boolean;
  quotaInfo: {
    isFreeMode: boolean;
    isVip: boolean;
    remaining: number;
    limit: number;
  } | null;
  isFreeExhausted: boolean;
}

const WeChatReviewPanel: React.FC<WeChatReviewPanelProps> = ({
  banner,
  cover,
  icon,
  isGenerating,
  progress,
  onGenerate,
  onDownloadAll,
  onDownloadSingle,
  hasCharacterDNA,
  quotaInfo,
  isFreeExhausted
}) => {
  const texts = getTexts();
  const [previewAsset, setPreviewAsset] = useState<{
    type: string;
    url: string;
  } | null>(null);

  const hasAnyAsset = banner || cover || icon;
  const allGenerated = banner?.status === GenerationStatus.SUCCESS &&
                       cover?.status === GenerationStatus.SUCCESS &&
                       icon?.status === GenerationStatus.SUCCESS;

  return (
    <div className="bg-white border-4 border-black p-4 md:p-6 rounded-lg pop-shadow">
      <h3 className="text-lg md:text-xl font-black uppercase mb-4 flex items-center gap-2">
        <span>📋</span>
        <span>{texts.reviewTitle}</span>
      </h3>

      {/* 说明 */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded p-3 mb-4 text-xs md:text-sm">
        <p className="font-bold text-blue-800 mb-2">{texts.reviewDesc}</p>
        <ul className="space-y-1 text-blue-700 mb-2">
          <li>• <strong>{texts.reviewBanner}</strong> (750×400): 活潑色調，有故事性</li>
          <li>• <strong>{texts.reviewCover}</strong> (240×240): 透明背景，半身像</li>
          <li>• <strong>{texts.reviewIcon}</strong> (50×50): 透明背景，頭部特寫</li>
        </ul>

        {/* 配额提示 */}
        <div className="border-t-2 border-blue-200 pt-2 mt-2">
          {isFreeExhausted ? (
            <p className="text-red-600 font-bold">❌ 当前账号无配额，无法生成</p>
          ) : (
            <>
              <p className="text-orange-600 font-bold">⚠️ 生成辅助资源需要额外消耗 1 次配额</p>
              {quotaInfo && (
                <p className="text-blue-600 text-xs mt-1">
                  剩余配额：{quotaInfo.remaining} 次
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* 生成按钮 */}
      {!hasAnyAsset && (
        <button
          onClick={onGenerate}
          disabled={!hasCharacterDNA || isGenerating || isFreeExhausted}
          className={`
            w-full py-3 text-sm md:text-base font-black uppercase border-4 border-black rounded
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all
            ${!hasCharacterDNA || isGenerating || isFreeExhausted
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-400 hover:bg-purple-500 text-white active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }
          `}
          title={isFreeExhausted ? '配额已用完' : (!hasCharacterDNA ? '请先生成表情包' : '')}
        >
          {isGenerating ? texts.reviewGenerating : texts.reviewGenerateButton}
        </button>
      )}

      {/* 进度显示 */}
      {isGenerating && (
        <div className="mt-4 space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border-2 border-black">
            <div className="bg-purple-500 h-full animate-pulse w-full"></div>
          </div>
          <p className="text-center text-sm font-bold text-purple-700 whitespace-pre-line">
            {progress}
          </p>
        </div>
      )}

      {/* 预览和下载 */}
      {hasAnyAsset && !isGenerating && (
        <div className="space-y-4">
          {/* 预览区 */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {/* Banner */}
            <div className="col-span-3">
              <p className="text-xs font-bold mb-1 flex items-center justify-between">
                <span>横幅 (750×400)</span>
                {banner?.status === GenerationStatus.SUCCESS && (
                  <span className="text-green-600">✓</span>
                )}
              </p>
              {banner?.url ? (
                <div
                  onClick={() => setPreviewAsset({ type: 'Banner', url: banner.url })}
                  className="border-2 border-black rounded overflow-hidden cursor-pointer hover:border-purple-500 transition-colors"
                >
                  <img src={banner.url} alt="Banner" className="w-full h-auto" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded h-20 flex items-center justify-center text-gray-400 text-xs">
                  {banner?.status === GenerationStatus.ERROR ? '生成失败' : '等待生成'}
                </div>
              )}
            </div>

            {/* Cover */}
            <div>
              <p className="text-xs font-bold mb-1 flex items-center justify-between">
                <span>封面</span>
                {cover?.status === GenerationStatus.SUCCESS && (
                  <span className="text-green-600">✓</span>
                )}
              </p>
              {cover?.url ? (
                <div
                  onClick={() => setPreviewAsset({ type: 'Cover (240×240)', url: cover.url })}
                  className="border-2 border-black rounded overflow-hidden cursor-pointer hover:border-purple-500 transition-colors bg-checkerboard"
                >
                  <img src={cover.url} alt="Cover" className="w-full h-auto" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded aspect-square flex items-center justify-center text-gray-400 text-xs">
                  {cover?.status === GenerationStatus.ERROR ? '失败' : '等待'}
                </div>
              )}
            </div>

            {/* Icon */}
            <div>
              <p className="text-xs font-bold mb-1 flex items-center justify-between">
                <span>图标</span>
                {icon?.status === GenerationStatus.SUCCESS && (
                  <span className="text-green-600">✓</span>
                )}
              </p>
              {icon?.url ? (
                <div
                  onClick={() => setPreviewAsset({ type: 'Icon (50×50)', url: icon.url })}
                  className="border-2 border-black rounded overflow-hidden cursor-pointer hover:border-purple-500 transition-colors bg-checkerboard"
                >
                  <img src={icon.url} alt="Icon" className="w-full h-auto" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded aspect-square flex items-center justify-center text-gray-400 text-xs">
                  {icon?.status === GenerationStatus.ERROR ? '失败' : '等待'}
                </div>
              )}
            </div>

            {/* 重新生成按钮 */}
            <div className="flex items-center justify-center">
              <button
                onClick={onGenerate}
                disabled={isGenerating || isFreeExhausted}
                className={`px-3 py-2 text-xs font-bold border-2 border-black rounded transition-colors ${
                  isGenerating || isFreeExhausted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-300 hover:bg-yellow-400'
                }`}
                title={isFreeExhausted ? '配额已用完' : ''}
              >
                🔄 {getCurrentLanguage() === 'zh-TW' ? '重新生成' : '重新生成'}
              </button>
            </div>
          </div>

          {/* 下载按钮 */}
          {allGenerated && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onDownloadAll}
                className="py-2 text-sm font-bold border-2 border-black rounded bg-green-400 hover:bg-green-500 text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
              >
                {texts.reviewDownloadAll}
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => onDownloadSingle('banner')}
                  className="flex-1 py-2 text-xs font-bold border border-gray-400 rounded bg-white hover:bg-gray-100"
                  title="下载横幅"
                >
                  🖼️
                </button>
                <button
                  onClick={() => onDownloadSingle('cover')}
                  className="flex-1 py-2 text-xs font-bold border border-gray-400 rounded bg-white hover:bg-gray-100"
                  title="下载封面"
                >
                  📄
                </button>
                <button
                  onClick={() => onDownloadSingle('icon')}
                  className="flex-1 py-2 text-xs font-bold border border-gray-400 rounded bg-white hover:bg-gray-100"
                  title="下载图标"
                >
                  🔖
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 预览模态框 */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="bg-white p-4 max-w-2xl w-full rounded-lg border-4 border-black relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewAsset(null)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full border-2 border-black font-bold text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-black mb-4">{previewAsset.type}</h3>
            <div className="border-2 border-black bg-checkerboard">
              <img
                src={previewAsset.url}
                alt={previewAsset.type}
                className={previewAsset.type.toLowerCase().includes('icon') ? 'w-full h-auto wechat-icon-preview' : 'w-full h-auto'}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">长按图片可保存</p>
          </div>
        </div>
      )}

      <style>{`
        .bg-checkerboard {
          background-image:
            linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
            linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }

        .wechat-icon-preview {
          image-rendering: pixelated;
        }
      `}</style>
    </div>
  );
};

export default WeChatReviewPanel;
