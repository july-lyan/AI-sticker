
import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import ReferenceUploader from './components/ReferenceUploader';
import StickerGrid from './components/StickerGrid';
import FreeQuotaDisplay from './components/FreeQuotaDisplay';
import { GeneratedSticker, GenerationStatus, StickerCategory, StickerPrompt, StickerStyleId, GenerationMode } from './types';
import { generateStickerImage, generateStickerGrid, analyzeCharacter } from './services/geminiService';
import { getFreeQuota } from './services/paymentApi';
import { sliceGrid2x2, removeBackgroundSmart, generateMarketingSheet } from './utils/imageProcessor';
import { STICKER_TEMPLATES, STYLES, CUSTOM_PRESETS, generateComicStages } from './constants';


// Utility to shuffle array and pick N (Default 12 now)
const getRandomPrompts = (prompts: StickerPrompt[], count: number = 12): StickerPrompt[] => {
  const shuffled = [...prompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const App: React.FC = () => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{
    isFreeMode: boolean;
    isVip: boolean;
    remaining: number;
    limit: number;
  } | null>(null);
  
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [currentCategory, setCurrentCategory] = useState<StickerCategory>('female');
  const [currentStyle, setCurrentStyle] = useState<StickerStyleId>('popart');

  // Quantity selection: 4, 8, 12
  const [targetCount, setTargetCount] = useState<number>(12);

  // 生成模式：random(系统随机) | custom(自定义) | comic(四格漫画)
  const [generationMode, setGenerationMode] = useState<GenerationMode>('random');

  // 自定义模式：用户选中的表情ID列表
  const [selectedCustomEmotions, setSelectedCustomEmotions] = useState<string[]>([]);

  // 四格漫画模式：用户选择的单个表情
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');

  // Custom Input (保留用于向后兼容，但不再使用)
  const [customInput, setCustomInput] = useState<string>('');

  // We store the specific list of active prompts here
  const [activePrompts, setActivePrompts] = useState<StickerPrompt[]>([]);
  
  // Store the analyzed character description (DNA)
  const [characterDescription, setCharacterDescription] = useState<string | null>(null);
  
  const [generatedStickers, setGeneratedStickers] = useState<Record<string, GeneratedSticker>>({});
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Sheet Modal State
  const [showSheetModal, setShowSheetModal] = useState<boolean>(false);
  const [sheetImage, setSheetImage] = useState<string | null>(null);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState<boolean>(false);

  // Single Sticker Preview Modal (Mobile)
  const [previewSticker, setPreviewSticker] = useState<{url: string, label: string} | null>(null);
  // Ref to control stopping the batch generation
  const stopRef = useRef<boolean>(false);

  // Device ID (used for backend user identification)
  useEffect(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('deviceId', id);
    }
    setDeviceId(id);
  }, []);

  const refreshQuota = useCallback(async () => {
    if (!deviceId) return;
    try {
      const q = await getFreeQuota(deviceId);
      setQuotaInfo({
        isFreeMode: q.isFreeMode,
        isVip: q.isVip,
        remaining: q.remaining,
        limit: q.limit
      });
    } catch {
      setQuotaInfo(null);
    }
  }, [deviceId]);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  const isFreeRestricted = Boolean(quotaInfo?.isFreeMode && !quotaInfo?.isVip);
  const isFreeExhausted = Boolean(quotaInfo?.isFreeMode && quotaInfo.remaining <= 0);

  // Initialize random prompts on mount (default 12)
  useEffect(() => {
    setActivePrompts(getRandomPrompts(STICKER_TEMPLATES['female'].prompts, 12));
  }, []);

  // When category changes, reset random prompts based on targetCount
  const handleCategoryChange = (cat: StickerCategory) => {
    setCurrentCategory(cat);

    // 清空之前的选择
    setSelectedCustomEmotions([]);
    setSelectedEmotion('');
    setGeneratedStickers({});
    setCharacterDescription(null);

    // 根据当前模式重新生成/清空prompts
    if (generationMode === 'random') {
      setActivePrompts(getRandomPrompts(STICKER_TEMPLATES[cat].prompts, targetCount));
    } else {
      // 自定义模式和四格漫画模式：清空等待用户选择
      setActivePrompts([]);
    }
  };

  // Re-shuffle current category
  const handleShuffle = () => {
    const newPrompts = getRandomPrompts(STICKER_TEMPLATES[currentCategory].prompts, targetCount);
    setActivePrompts(newPrompts);
    setGeneratedStickers({});
  };

  // 修改生成数量
  const handleTargetCountChange = (count: number) => {
    if (isFreeRestricted && count !== 4) {
      setTargetCount(4);
      return;
    }

    setTargetCount(count);

    // 四格漫画模式仅支持4张，切换到其他数量时自动切换到随机模式
    if (count !== 4 && generationMode === 'comic') {
      setGenerationMode('random');
      setSelectedEmotion('');
    }

    // 自定义模式下，清空已选表情（因为数量变了）
    if (generationMode === 'custom') {
      setSelectedCustomEmotions([]);
      setActivePrompts([]);
    }

    // 随机模式下，重新生成prompts（避免累加导致重复）
    if (generationMode === 'random') {
      const pool = STICKER_TEMPLATES[currentCategory].prompts;
      const newPrompts = getRandomPrompts(pool, count);
      setActivePrompts(newPrompts);
    }
  };

  useEffect(() => {
    if (!isFreeRestricted) return;
    if (targetCount !== 4) {
      handleTargetCountChange(4);
    }
  }, [isFreeRestricted, targetCount]);

  // 切换生成模式
  const handleModeChange = (mode: GenerationMode) => {
    setGenerationMode(mode);

    // 清空之前的选择
    setSelectedCustomEmotions([]);
    setSelectedEmotion('');
    setActivePrompts([]);

    if (mode === 'random') {
      // 随机模式：立即生成随机表情
      const newPrompts = getRandomPrompts(STICKER_TEMPLATES[currentCategory].prompts, targetCount);
      setActivePrompts(newPrompts);
    } else if (mode === 'custom') {
      // 自定义模式：等待用户选择
      // activePrompts将在用户选择表情后更新
    } else if (mode === 'comic') {
      // 四格漫画模式：强制设置为4张
      if (targetCount !== 4) {
        setTargetCount(4);
      }
      // 等待用户选择表情
    }
  };

  // 四格漫画模式：选择表情（单选）
  const handleComicEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    // 生成四格漫画的连续动作
    const comicPrompts = generateComicStages(emotion);
    setActivePrompts(comicPrompts);
  };

  // 自定义模式：切换表情选择（多选）
  const handleCustomEmotionToggle = (emotionId: string) => {
    setSelectedCustomEmotions(prev => {
      let newSelection: string[];

      if (prev.includes(emotionId)) {
        // 取消选择
        newSelection = prev.filter(id => id !== emotionId);
      } else {
        // 添加选择（但不能超过目标数量）
        if (prev.length >= targetCount) {
          return prev; // 已达到上限，不添加
        }
        newSelection = [...prev, emotionId];
      }

      // 更新activePrompts
      const allPrompts = STICKER_TEMPLATES[currentCategory].prompts;
      const selectedPrompts = allPrompts.filter(p => newSelection.includes(p.id));
      setActivePrompts(selectedPrompts);

      return newSelection;
    });
  };

  const ensurePaid = useCallback(async (): Promise<string> => {
    if (!deviceId) {
      throw new Error('设备ID未就绪，请刷新页面重试');
    }

    if (quotaInfo?.isFreeMode) {
      if (quotaInfo.remaining <= 0) {
        throw new Error('今日免费次数已用完，请明天再来');
      }
      return 'free-mode';
    }

    // If we already have an order/token, verify first
    if (paymentOrderId && paymentToken) {
      try {
        const { verifyPayment } = await import('./services/paymentApi');
        const status = await verifyPayment({ orderId: paymentOrderId, deviceId });
        if (status.status === 'paid' && status.remainingGrids > 0) {
          return paymentToken;
        }
      } catch {
        // fall through to create a new order
      }
    }

    const { createPaymentOrder, mockPay, verifyPayment } = await import('./services/paymentApi');

    setLoadingProgress('🧾 正在创建订单...');
    const order = await createPaymentOrder({ count: targetCount as 4 | 8 | 12, deviceId });
    setPaymentOrderId(order.orderId);
    setPaymentToken(order.paymentToken);

    setLoadingProgress('✅ 正在模拟支付(开发环境)...');
    await mockPay({ orderId: order.orderId, deviceId });

    setLoadingProgress('⏳ 正在确认支付状态...');
    for (let i = 0; i < 30; i++) {
      const v = await verifyPayment({ orderId: order.orderId, deviceId });
      if (v.status === 'paid') {
        return order.paymentToken;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error('支付确认超时，请重试');
  }, [deviceId, paymentOrderId, paymentToken, quotaInfo?.isFreeMode, quotaInfo?.remaining, targetCount]);


  const handleImageChange = (base64: string | null) => {
    setReferenceImage(base64);
    // Clear all generated stickers and description when the reference image changes
    setGeneratedStickers({});
    setCharacterDescription(null); 
    setErrorMsg(null);
  };

  // Single Sticker Generation
  const generateSingleSticker = useCallback(async (id: string, prompt: string, currentRefImage: string): Promise<'SUCCESS' | 'ERROR' | 'RATE_LIMIT'> => {
    if (!currentRefImage) return 'ERROR';
    const key = `${id}_${currentStyle}`;

    setGeneratedStickers(prev => ({
      ...prev,
      [key]: { id: key, url: prev[key]?.url || '', status: GenerationStatus.GENERATING }
    }));
    try {
      const token = await ensurePaid();

      // Ensure we have a description (DNA)
      let dna = characterDescription;
      if (!dna) {
        const categoryLabel = STICKER_TEMPLATES[currentCategory].label;
        dna = await analyzeCharacter('', currentRefImage, categoryLabel);
        setCharacterDescription(dna);
      }

      const styleConfig = STYLES[currentStyle];

      const resultBase64 = await generateStickerImage(
        token, 
        currentRefImage, 
        dna!,
        prompt,
        styleConfig
      );

      const smartBgRemoved = await removeBackgroundSmart(resultBase64);

      setGeneratedStickers(prev => ({
        ...prev,
        [key]: { id: key, url: smartBgRemoved, status: GenerationStatus.SUCCESS }
      }));
      refreshQuota();
      return 'SUCCESS';
    } catch (err: any) {
      console.error(`Error generating sticker ${id}:`, err);
      setGeneratedStickers(prev => ({
        ...prev,
        [key]: { id: key, url: prev[key]?.url || '', status: GenerationStatus.ERROR }
      }));
      if (err.message && err.message.includes("429")) return 'RATE_LIMIT';
      return 'ERROR';
    }
  }, [currentStyle, characterDescription, currentCategory, ensurePaid, refreshQuota]);

  const handleManualGenerate = useCallback(async (id: string, prompt: string) => {
    if (!referenceImage) return;
    await generateSingleSticker(id, prompt, referenceImage);
  }, [referenceImage, generateSingleSticker]);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    setGlobalLoading(false);
    setLoadingProgress('');
  }, []);

  // Batch Generation
  const handleBatchGenerate = useCallback(async () => {
    if (!referenceImage) return;
    if (isFreeExhausted) {
      alert('今日免费次数已用完，请明天再来');
      return;
    }
    
    if (activePrompts.length === 0) {
      alert("Prompts list is empty.");
      return;
    }
    setGlobalLoading(true);
    setErrorMsg(null);
    stopRef.current = false;

    try {
      const token = await ensurePaid();

      // STEP 1: Analyze Character
      let dna = characterDescription;
      if (!dna) {
        setLoadingProgress("🔍 正在分析角色特征 (Step 1/2)...");
        try {
          const categoryMap: Record<string, string> = {
            female: 'Female Adult',
            male: 'Male Adult',
            child: 'Child/Toddler',
            elder: 'Elderly Person',
            pet: 'Pet/Animal',
            couple: 'Couple (Romantic)',
            duo: 'Duo/Friends',
            family: 'Family (Adult & Child)',
            human_pet: 'Human & Pet'
          };
          const categoryLabel = categoryMap[currentCategory] || 'Character';
          
          dna = await analyzeCharacter('', referenceImage, categoryLabel);
          setCharacterDescription(dna);
        } catch (err) {
          console.error("Analysis failed", err);
          setErrorMsg("角色分析失败，请稍后再试。");
          setGlobalLoading(false);
          return;
        }
      }

      // STEP 2: Prepare Batches
      // We process activePrompts in chunks of 4. 
      // If the last chunk is smaller than 4, we pad it with duplicates to satisfy the API.
      const batches = [];
      for (let i = 0; i < activePrompts.length; i += 4) {
        batches.push(activePrompts.slice(i, i + 4));
      }

      const pendingBatches = batches.filter(batch => {
        const allDone = batch.every(p => {
          const key = `${p.id}_${currentStyle}`;
          return generatedStickers[key]?.status === GenerationStatus.SUCCESS;
        });
        return !allDone;
      });

      if (pendingBatches.length === 0) {
         if (!window.confirm("所有表情已生成。是否强制重新生成？")) {
           setGlobalLoading(false);
           return;
         }
      }

      let masterGridImage: string | null = null;
      let usingGeneratedMaster = false;
      let batchIndex = 0;

      for (const batch of (pendingBatches.length > 0 ? pendingBatches : batches)) {
        if (stopRef.current) break;
        batchIndex++;
        setLoadingProgress(`🎨 正在绘制第 ${batchIndex} / ${pendingBatches.length || batches.length} 组...`);

        setGeneratedStickers(prev => {
          const next = { ...prev };
          batch.forEach(p => {
            const key = `${p.id}_${currentStyle}`;
            next[key] = { id: key, url: next[key]?.url || '', status: GenerationStatus.GENERATING };
          });
          return next;
        });

        try {
          const styleConfig = STYLES[currentStyle];
          const isSlaveBatch = usingGeneratedMaster && !!masterGridImage;
          const currentRef = isSlaveBatch ? masterGridImage! : referenceImage;

          // PADDING LOGIC:
          // Ensure we send exactly 4 prompts to the API.
          let apiBatch = [...batch];
          if (batch.length < 4) {
              const padCount = 4 - batch.length;
              for(let k=0; k<padCount; k++) {
                  apiBatch.push(batch[0]); // Pad with clones of the first item
              }
          }

          const gridBase64 = await generateStickerGrid(
             token,
             currentRef,
             dna!,
             apiBatch, // Send padded batch
             styleConfig,
             isSlaveBatch
          );

          if (!usingGeneratedMaster && gridBase64) {
            masterGridImage = gridBase64;
            usingGeneratedMaster = true;
          }

          const slices = await sliceGrid2x2(gridBase64);
          const processedSlices = await Promise.all(slices.map(async (slice) => {
             return await removeBackgroundSmart(slice);
          }));

          setGeneratedStickers(prev => {
            const next = { ...prev };
            // Assign results only to the REAL prompts in this batch (ignore pads)
            batch.forEach((p, idx) => {
              if (idx < processedSlices.length) {
                const key = `${p.id}_${currentStyle}`;
                next[key] = { id: key, url: processedSlices[idx], status: GenerationStatus.SUCCESS };
              }
            });
            return next;
          });

        } catch (err: any) {
          console.error("Batch failed", err);
          setGeneratedStickers(prev => {
            const next = { ...prev };
            batch.forEach(p => {
              const key = `${p.id}_${currentStyle}`;
              next[key] = { ...next[key], status: GenerationStatus.ERROR };
            });
            return next;
          });

          if (err.message && err.message.includes("429")) {
            setErrorMsg("请求过于频繁 (429)。已停止生成，请稍候再试。");
            break;
          }
        }

        if (batch !== batches[batches.length - 1] && !stopRef.current) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("生成过程中发生错误");
    }

    setGlobalLoading(false);
    setLoadingProgress('');
    refreshQuota();
  }, [referenceImage, isFreeExhausted, activePrompts, currentStyle, generatedStickers, characterDescription, currentCategory, ensurePaid, refreshQuota]);

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folderName = `stickers_${currentCategory}_${currentStyle}`;
    const folder = zip.folder(folderName);
    let count = 0;

    activePrompts.forEach((prompt) => {
      const key = `${prompt.id}_${currentStyle}`;
      const sticker = generatedStickers[key];
      if (sticker && sticker.status === GenerationStatus.SUCCESS && sticker.url) {
        const base64Data = sticker.url.split(',')[1];
        if (folder && base64Data) {
           folder.file(`${prompt.label}_${currentStyle}.png`, base64Data, {base64: true});
           count++;
        }
      }
    });

    if (count === 0) return;

    const content = await zip.generateAsync({type:"blob"});
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sticker_pack_${currentStyle}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleGenerateSheet = async () => {
    const successImages: string[] = [];
    activePrompts.forEach(p => {
       const s = generatedStickers[`${p.id}_${currentStyle}`];
       if (s && s.status === GenerationStatus.SUCCESS && s.url) {
         successImages.push(s.url);
       }
    });

    if (successImages.length === 0) {
      alert("请先生成表情包！");
      return;
    }

    setIsGeneratingSheet(true);
    try {
      const sheetUrl = await generateMarketingSheet(successImages, "");
      setSheetImage(sheetUrl);
      setShowSheetModal(true);
    } catch (e) {
      console.error(e);
      alert("生成海报失败");
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  const downloadSheet = () => {
    if (!sheetImage) return;
    const a = document.createElement('a');
    a.href = sheetImage;
    a.download = `sticker_sheet_${currentStyle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStickerClick = (sticker: GeneratedSticker, label: string) => {
    setPreviewSticker({ url: sticker.url, label });
  };

  const hasAnySuccessInView = activePrompts.some(
    p => generatedStickers[`${p.id}_${currentStyle}`]?.status === GenerationStatus.SUCCESS
  );

  return (
    <div className="min-h-screen bg-pop-art p-2 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-6 md:mb-8 text-center pt-4 md:pt-0">
        <h1 className="text-3xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] text-stroke">
          AI 表情包<span className="text-yellow-400">批量工场</span>
        </h1>
        <p className="text-gray-700 font-bold mt-2 text-sm md:text-base">上传一张参考图，自动生成全套表情</p>
      </header>

      {errorMsg && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-500 text-white font-bold border-4 border-black text-center pop-shadow">
          {errorMsg}
        </div>
      )}

      {/* Main Layout - Three Column */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 pb-20 md:pb-0">

        {/* Left Sidebar: Settings Parameters */}
        <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
           {/* Free Quota Display (only in free mode) */}
           {deviceId && <FreeQuotaDisplay deviceId={deviceId} />}

           {/* Settings Panel */}
           <div className="bg-white border-4 border-black p-4 rounded-lg pop-shadow space-y-6">
             
             {/* 1. Category */}
             <div>
               <h3 className="font-bold mb-2 uppercase text-lg">1. 角色分类</h3>
               <div className="flex flex-wrap gap-2">
                  {(Object.keys(STICKER_TEMPLATES) as StickerCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex-1 min-w-[30%] py-2 font-bold border-2 rounded text-xs md:text-sm ${currentCategory === cat ? 'bg-yellow-400 border-black' : 'bg-gray-100 border-transparent text-gray-500'}`}
                    >
                      {STICKER_TEMPLATES[cat].label}
                    </button>
                  ))}
               </div>
             </div>

             {/* 2. Style */}
             <div>
               <h3 className="font-bold mb-2 uppercase text-lg">2. 艺术风格</h3>
               <div className="grid grid-cols-2 gap-2">
                 {Object.values(STYLES).map((style) => (
                   <button
                     key={style.id}
                     onClick={() => setCurrentStyle(style.id)}
                     className={`
                       px-2 py-2 text-xs md:text-sm font-bold border-2 rounded transition-all text-center
                       ${currentStyle === style.id
                         ? 'bg-blue-500 text-white border-black'
                         : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                     `}
                   >
                     {style.label}
                   </button>
                 ))}
               </div>
             </div>

             {/* 3. Quantity */}
             <div>
                <h3 className="font-bold mb-2 uppercase text-lg">3. 生成数量</h3>
                <div className="flex gap-2">
                  {[4, 8, 12].map(num => (
                    <button
                       key={num}
                       onClick={() => handleTargetCountChange(num)}
                       disabled={isFreeRestricted && num !== 4}
                       className={`flex-1 py-2 font-bold border-2 rounded text-sm ${
                         isFreeRestricted && num !== 4
                           ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                           : targetCount === num
                           ? 'bg-pink-400 text-white border-black'
                           : 'bg-white text-black border-gray-300'
                       }`}
                    >
                      {num}张
                    </button>
                  ))}
                </div>
             </div>

             {/* 4. 生成模式选择 */}
             <div>
               <h3 className="font-bold mb-2 uppercase text-lg">4. 生成模式</h3>
               <div className="grid grid-cols-3 gap-2">
                 {/* 系统随机模式 */}
                 <button
                   onClick={() => handleModeChange('random')}
                   className={`py-3 px-2 font-bold border-2 rounded text-xs md:text-sm transition-all ${
                     generationMode === 'random'
                       ? 'bg-blue-500 text-white border-black scale-105'
                       : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                   }`}
                 >
                   <div className="text-lg mb-1">🎲</div>
                   <div>系统随机</div>
                 </button>

                 {/* 自定义模式 */}
                 <button
                   onClick={() => handleModeChange('custom')}
                   className={`py-3 px-2 font-bold border-2 rounded text-xs md:text-sm transition-all ${
                     generationMode === 'custom'
                       ? 'bg-green-500 text-white border-black scale-105'
                       : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                   }`}
                 >
                   <div className="text-lg mb-1">✏️</div>
                   <div>自定义</div>
                 </button>

                 {/* 四格漫画模式 (仅4张时可用) */}
                 <button
                   onClick={() => targetCount === 4 && handleModeChange('comic')}
                   disabled={targetCount !== 4}
                   className={`py-3 px-2 font-bold border-2 rounded text-xs md:text-sm transition-all ${
                     generationMode === 'comic' && targetCount === 4
                       ? 'bg-purple-500 text-white border-black scale-105'
                       : targetCount !== 4
                       ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                       : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                   }`}
                 >
                   <div className="text-lg mb-1">📖</div>
                   <div>四格漫画</div>
                   {targetCount !== 4 && <div className="text-[10px] text-gray-400 mt-1">(仅4张)</div>}
                 </button>
               </div>
             </div>

             {/* 模式说明和操作区域 */}
             <div>
               {/* 系统随机模式 */}
               {generationMode === 'random' && (
                 <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                   <h4 className="font-bold text-sm text-blue-700 mb-2 flex items-center gap-2">
                     <span className="text-lg">🎲</span>
                     系统随机模式
                   </h4>
                   <p className="text-xs text-blue-600 mb-3">系统将自动为你选择{targetCount}个表情</p>
                   <button
                     onClick={handleShuffle}
                     className="w-full bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition-colors"
                   >
                     🎲 换一换 ({activePrompts.length}个表情)
                   </button>
                 </div>
               )}

               {/* 自定义模式 */}
               {generationMode === 'custom' && (
                 <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                   <h4 className="font-bold text-sm text-green-700 mb-2 flex items-center gap-2">
                     <span className="text-lg">✏️</span>
                     自定义模式
                     <span className="ml-auto text-xs font-bold text-green-600">
                       已选 {selectedCustomEmotions.length}/{targetCount}
                     </span>
                   </h4>
                   <p className="text-xs text-green-600 mb-3">
                     请选择 <span className="font-bold">{targetCount}</span> 个表情（点击选择/取消）
                   </p>

                   {/* 表情多选网格 */}
                   <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-white rounded border border-green-200">
                     {STICKER_TEMPLATES[currentCategory].prompts.map((prompt) => (
                       <button
                         key={prompt.id}
                         onClick={() => handleCustomEmotionToggle(prompt.id)}
                         disabled={selectedCustomEmotions.length >= targetCount && !selectedCustomEmotions.includes(prompt.id)}
                         className={`text-xs font-bold px-2 py-2 rounded border-2 transition-all ${
                           selectedCustomEmotions.includes(prompt.id)
                             ? 'bg-green-500 text-white border-green-700 scale-105'
                             : selectedCustomEmotions.length >= targetCount
                             ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                             : 'bg-white text-green-700 border-green-300 hover:bg-green-100'
                         }`}
                       >
                         {prompt.label}
                       </button>
                     ))}
                   </div>

                   {/* 选择提示 */}
                   {selectedCustomEmotions.length > 0 && (
                     <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
                       <span className="font-bold">已选择：</span>
                       {selectedCustomEmotions.length === targetCount ? (
                         <span className="ml-2 text-green-600">✓ 已选满 {targetCount} 个，可以生成了！</span>
                       ) : (
                         <span className="ml-2 text-orange-600">还需选择 {targetCount - selectedCustomEmotions.length} 个</span>
                       )}
                     </div>
                   )}
                 </div>
               )}

               {/* 四格漫画模式 */}
               {generationMode === 'comic' && (
                 <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                   <h4 className="font-bold text-sm text-purple-700 mb-2 flex items-center gap-2">
                     <span className="text-lg">📖</span>
                     四格漫画模式
                   </h4>
                   <p className="text-xs text-purple-600 mb-3">选择一个表情，生成4个连续动作阶段</p>

                   {/* 表情单选网格 */}
                   <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded border border-purple-200">
                     {STICKER_TEMPLATES[currentCategory].prompts.slice(0, 12).map((prompt) => (
                       <button
                         key={prompt.id}
                         onClick={() => handleComicEmotionSelect(prompt.label)}
                         className={`text-xs font-bold px-2 py-2 rounded border-2 transition-all ${
                           selectedEmotion === prompt.label
                             ? 'bg-purple-500 text-white border-purple-700 scale-105'
                             : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-100'
                         }`}
                       >
                         {prompt.label}
                       </button>
                     ))}
                   </div>

                   {/* 选择提示 */}
                   {selectedEmotion && (
                     <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-700">
                       <span className="font-bold">已选择：</span>{selectedEmotion}
                       <span className="ml-2 text-purple-500">（将生成4个连续阶段）</span>
                     </div>
                   )}
                 </div>
               )}
             </div>

           </div>
        </div>

        {/* Middle Column: Sticker Grid */}
        <div className="lg:col-span-6">
           <StickerGrid
             generatedStickers={Object.keys(generatedStickers).reduce((acc, key) => {
               if (key.endsWith(`_${currentStyle}`)) {
                  const promptId = key.replace(`_${currentStyle}`, '');
                  acc[promptId] = generatedStickers[key];
               }
               return acc;
             }, {} as Record<string, GeneratedSticker>)}
             prompts={activePrompts}
             onGenerate={handleManualGenerate}
             onStickerClick={handleStickerClick}
             isProcessing={globalLoading}
             hasPayment={!!paymentToken}
             hasReference={!!referenceImage}
           />
        </div>

        {/* Right Sidebar: Upload & Actions */}
        <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
           <ReferenceUploader onImageSelected={handleImageChange} />

           {/* Actions */}
           <div className="bg-white border-4 border-black p-4 rounded-lg pop-shadow static lg:sticky lg:top-4 z-30">
             
             {globalLoading ? (
               <div className="space-y-2">
                 <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border border-black">
                   <div className="bg-green-500 h-4 animate-pulse w-full"></div>
                 </div>
                 <p className="text-center font-bold text-sm animate-pulse">{loadingProgress}</p>
                 <button
                   onClick={handleStop}
                   className="w-full py-3 font-black bg-red-500 text-white border-2 border-black rounded hover:bg-red-600"
                 >
                   停止生成
                 </button>
               </div>
             ) : (
	               <button
	                 onClick={handleBatchGenerate}
	                 disabled={
	                  isFreeExhausted ||
	                  !referenceImage ||
	                  (generationMode === 'comic' && !selectedEmotion) ||
	                  (generationMode === 'custom' && selectedCustomEmotions.length !== targetCount) ||
	                  activePrompts.length === 0
	                }
                 className={`
                   w-full py-3 text-sm md:text-base font-black uppercase border-4 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                   active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
	                   ${(
	                    isFreeExhausted ||
	                    !referenceImage ||
	                    (generationMode === 'comic' && !selectedEmotion) ||
	                    (generationMode === 'custom' && selectedCustomEmotions.length !== targetCount) ||
	                    activePrompts.length === 0
	                  ) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-400 hover:bg-purple-500 text-white'}
	                 `}
	               >
                 {generationMode === 'comic' ? (
                   selectedEmotion ? (
                     <>
                       <div>📖 四格漫画</div>
                       <div className="text-xs mt-1">{selectedEmotion}</div>
                     </>
                   ) : '📖 请先选择表情'
                 ) : generationMode === 'custom' ? (
                   selectedCustomEmotions.length === targetCount
                     ? (
                       <>
                         <div>✨ 生成表情包</div>
                         <div className="text-xs mt-1">{targetCount}张自定义</div>
                       </>
                     )
                     : (
                       <>
                         <div>✏️ 请选择表情</div>
                         <div className="text-xs mt-1">已选{selectedCustomEmotions.length}/{targetCount}</div>
                       </>
                     )
                 ) : (
                   <>
                     <div>✨ 开始生成</div>
                     <div className="text-xs mt-1">{activePrompts.length}张表情</div>
                   </>
                 )}
               </button>
             )}

             {hasAnySuccessInView && (
               <button
                 onClick={handleDownloadAll}
                 className="w-full mt-4 py-2 font-bold text-sm border-2 border-black rounded bg-green-400 hover:bg-green-500 text-black transition-colors"
               >
                 📥 打包下载 ZIP
               </button>
             )}

             {hasAnySuccessInView && (
               <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                  <button
                    onClick={handleGenerateSheet}
                    className="w-full py-3 font-black text-sm uppercase bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none"
                  >
                     {isGeneratingSheet ? "海报生成中..." : "✨ 生成全家福 (适合手机分享)"}
                  </button>
               </div>
             )}
           </div>
        </div>
      </main>

      {/* Sheet Modal */}
      {showSheetModal && sheetImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white p-4 w-full max-w-xl rounded-lg border-4 border-black relative shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)] my-auto">
            <button 
              onClick={() => setShowSheetModal(false)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full border-2 border-black font-bold text-lg z-10 flex items-center justify-center"
            >
              ✕
            </button>
            
            <h2 className="text-xl md:text-2xl font-black uppercase text-center mb-2">长按图片保存到相册</h2>
            <p className="text-center text-xs text-gray-500 mb-4 font-bold">推荐：使用微信/浏览器原生"保存图片"功能</p>
            
            <div className="border-4 border-black mb-4 bg-gray-100">
              <img src={sheetImage} alt="Marketing Sheet" className="w-full h-auto block select-none" style={{touchAction: 'none'}} />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={downloadSheet}
                className="flex-1 py-3 bg-green-400 hover:bg-green-500 text-black font-black border-2 border-black uppercase rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all hidden md:block"
              >
                下载海报
              </button>
              <button 
                onClick={() => setShowSheetModal(false)}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-black font-bold border-2 border-black rounded md:hidden"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Sticker Preview Modal (Mobile Only mostly) */}
      {previewSticker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setPreviewSticker(null)}>
           <div className="bg-transparent p-4 w-full max-w-sm relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
             <div className="bg-white p-2 border-4 border-white rounded-lg shadow-2xl transform rotate-1 mb-4">
                <img 
                  src={previewSticker.url} 
                  alt={previewSticker.label} 
                  className="w-full h-auto rounded"
                />
             </div>
             <p className="text-white font-bold text-lg mb-2">{previewSticker.label}</p>
             <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold border border-white/30 backdrop-blur-sm">
                长按图片保存
             </div>
             <button 
                onClick={() => setPreviewSticker(null)}
                className="mt-8 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2 border-white/50"
             >
                ✕
             </button>
           </div>
        </div>
      )}

      <footer className="max-w-6xl mx-auto mt-8 md:mt-16 text-center text-xs md:text-sm font-bold text-gray-500 pb-8">
        <p>Powered by Gemini 3 Pro & @imgly/background-removal</p>
      </footer>
      
      <style>{`
        .text-stroke {
          -webkit-text-stroke: 1px black;
        }
        @media (min-width: 768px) {
          .text-stroke {
            -webkit-text-stroke: 2px black;
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
