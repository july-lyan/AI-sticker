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
    { 'X-Device-Id': localStorage.getItem('deviceId') || '' }
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
    }
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
    }
  );

  return data.gridImage;
};
