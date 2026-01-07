import type { StyleDefinition, StickerPrompt } from '../types';
import { postJson } from './apiClient';

export const analyzeCharacter = async (
  _paymentToken: string,
  referenceImageBase64: string,
  userCategoryLabel: string
): Promise<string> => {
  const data = await postJson<{ characterDNA: string }>(
    '/api/analyze-character',
    { referenceImage: referenceImageBase64, category: userCategoryLabel },
    { 'X-Device-Id': localStorage.getItem('deviceId') || '' },
    60000 // 60秒超时（分析可能需要较长时间）
  );
  return data.characterDNA;
};

export const generateStickerImage = async (
  paymentToken: string,
  referenceImageBase64: string,
  characterDescription: string,
  promptDetail: string,
  styleConfig: StyleDefinition
): Promise<string> => {
  const data = await postJson<{ image: string }>(
    '/api/generate-sticker-image',
    {
      characterDNA: characterDescription,
      prompt: promptDetail,
      style: styleConfig.id,
      referenceImage: referenceImageBase64
    },
    {
      'X-Device-Id': localStorage.getItem('deviceId') || '',
      'X-Payment-Token': paymentToken
    },
    120000 // 120秒超时（图片生成需要较长时间）
  );
  return data.image;
};

export const generateStickerGrid = async (
  paymentToken: string,
  referenceImageBase64: string,
  characterDescription: string,
  prompts: StickerPrompt[],
  styleConfig: StyleDefinition,
  useMasterReference: boolean = false
): Promise<string> => {
  const data = await postJson<{ gridImage: string }>(
    '/api/generate-sticker-grid',
    {
      characterDNA: characterDescription,
      prompts: prompts.map((p) => ({ prompt: p.prompt })),
      style: styleConfig.id,
      referenceImage: referenceImageBase64,
      isSlave: useMasterReference
    },
    {
      'X-Device-Id': localStorage.getItem('deviceId') || '',
      'X-Payment-Token': paymentToken
    },
    120000 // 120秒超时（批量生成需要较长时间）
  );

  return data.gridImage;
};

// ==================== 微信审核资源生成 ====================

/**
 * 一键生成所有审核资源
 */
export const generateReviewAssets = async (
  paymentToken: string,
  referenceImageBase64: string,
  characterDescription: string,
  styleId: string
): Promise<{
  banner: string;
  cover: string;
  icon: string;
  metadata: { generatedAt: string; style: string };
}> => {
  const data = await postJson<{
    banner: string;
    cover: string;
    icon: string;
    metadata: { generatedAt: string; style: string };
  }>(
    '/api/generate-review-assets',
    {
      characterDNA: characterDescription,
      referenceImage: referenceImageBase64,
      style: styleId
    },
    {
      'X-Device-Id': localStorage.getItem('deviceId') || '',
      'X-Payment-Token': paymentToken
    },
    180000 // 3分钟超时（生成三个资源需要较长时间）
  );
  return data;
};
