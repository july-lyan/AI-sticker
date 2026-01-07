import React, { useEffect, useState } from 'react';
import { getFreeQuota } from '../services/paymentApi';
import { getTexts, replacePlaceholders } from '../i18n';

interface FreeQuotaDisplayProps {
  deviceId: string;
  refreshKey?: number; // 用于外部触发刷新
}

const FreeQuotaDisplay: React.FC<FreeQuotaDisplayProps> = ({ deviceId, refreshKey = 0 }) => {
  const texts = getTexts();
  const [quota, setQuota] = useState<{
    remaining: number;
    used: number;
    limit: number;
    resetAt: string;
    isFreeMode: boolean;
    isVip: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    loadQuota();
  }, [deviceId, refreshKey]); // 当 refreshKey 变化时也触发刷新

  const loadQuota = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFreeQuota(deviceId);
      setQuota(data);
    } catch (error: any) {
      console.error('Failed to load quota:', error);
      setError(error.message || '加载额度信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载骨架屏
  if (loading) {
    return (
      <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-4 border-black pop-shadow rounded-lg mb-4 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-300 rounded w-32"></div>
          <div className="h-6 bg-gray-300 rounded-full w-16"></div>
        </div>
        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 border-4 border-red-500 pop-shadow rounded-lg mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black uppercase text-red-700">⚠️ 加载失败</h3>
          <button
            onClick={loadQuota}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded font-bold hover:bg-red-600"
          >
            重试
          </button>
        </div>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  if (!quota || !quota.isFreeMode) {
    return null;
  }

  const percentage = (quota.remaining / quota.limit) * 100;
  const isLow = quota.remaining <= 1;
  const isExhausted = quota.remaining === 0;

  return (
    <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-4 border-black pop-shadow rounded-lg mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black uppercase">{texts.quotaTitle}</h3>
        {isExhausted ? (
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold border-2 border-black">
            {texts.quotaExhausted}
          </span>
        ) : isLow ? (
          <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full font-bold border-2 border-black">
            {texts.quotaLow}
          </span>
        ) : (
          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold border-2 border-black">
            {texts.quotaAvailable}
          </span>
        )}
      </div>

      <p className="text-[10px] text-gray-700 font-bold mb-2">
        {quota.isVip ? texts.quotaVipDesc : texts.quotaFreeDesc}
      </p>

      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold">{texts.quotaRemaining}</span>
            <span className="font-bold">
              {quota.remaining} / {quota.limit}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full border-2 border-black overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isExhausted
                  ? 'bg-red-500'
                  : isLow
                  ? 'bg-yellow-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-600">
        {isExhausted ? (
          <>
            {texts.quotaResetTomorrow}
            <span className="font-bold text-blue-600"> {texts.quotaUpgrade}</span>
          </>
        ) : (
          <>{replacePlaceholders(texts.quotaPerDay, { limit: quota.limit })}</>
        )}
      </p>
    </div>
  );
};

export default FreeQuotaDisplay;
