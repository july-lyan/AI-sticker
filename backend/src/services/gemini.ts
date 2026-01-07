import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEYS } from '../utils/env.js';
import { STYLES, type StyleId } from '../constants/styles.js';
import { log } from '../utils/logger.js';

// API Key rotation state
let currentKeyIndex = 0;
const disabledApiKeys = new Set<string>();

function getNextApiKey(): string {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('Missing GEMINI_API_KEY in environment variables');
  }
  for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
    const key = GEMINI_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
    if (!disabledApiKeys.has(key)) return key;
  }
  throw new Error('All GEMINI_API_KEY values are disabled (invalid/expired)');
}

function getAllApiKeys(): string[] {
  return GEMINI_API_KEYS.filter((key) => !disabledApiKeys.has(key));
}

const NANO_BANANA_STYLE = `
  - Art Style: "Nano Banana" aesthetic, High-Quality Pop Mart blind box toy texture.
  - Visuals: 3D rendered cute character, expressive facial features, sharp details.
  - Colors: Vibrant, pastel candy colors, high saturation, clean lighting.
  - Outlines: Super thick, smooth, consistent white die-cut border.
  - Texture: Matte PVC or vinyl toy texture, premium finish.
`;

// Helper function to determine if a style should use 3D/Nano Banana aesthetic
const shouldUse3D = (styleId: StyleId): boolean => {
  return styleId === '3d';
};

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

const looksLikeApiKeyInvalid = (error: any): boolean => {
  const status = error?.status ?? error?.code;
  if (status !== 400) return false;

  const message = typeof error?.message === 'string' ? error.message : '';
  const haystack = `${message} ${safeStringify(error)}`.toLowerCase();
  return (
    haystack.includes('api_key_invalid') ||
    haystack.includes('api key expired') ||
    haystack.includes('apikey expired') ||
    haystack.includes('api key invalid')
  );
};

const callApiWithRetry = async <T>(
  fn: (apiKey: string) => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> => {
  const allKeys = getAllApiKeys();
  if (allKeys.length === 0) {
    throw new Error('Missing GEMINI_API_KEY in environment variables');
  }
  const totalAttempts = Math.min(retries + 1, allKeys.length * 2); // Try each key at least once
  let lastError: any;

  for (let i = 0; i < totalAttempts; i++) {
    let apiKey: string | null = null;
    let keyIndex = 0;
    try {
      apiKey = getNextApiKey();
      keyIndex = GEMINI_API_KEYS.indexOf(apiKey) + 1;
      log.info(`[Gemini] Using API Key #${keyIndex} (attempt ${i + 1}/${totalAttempts})`);
      return await fn(apiKey);
    } catch (error: any) {
      lastError = error;
      const isApiKeyInvalid = looksLikeApiKeyInvalid(error);
      const isServerError =
        error.code === 500 ||
        error.status === 500 ||
        error.code === 503 ||
        error.status === 503;
      const isNetworkError =
        error.message?.includes('fetch failed') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT');
      const isRateLimited = error.code === 429 || error.status === 429;
      const isPermissionDenied = error.code === 403 || error.status === 403;
      const shouldRetry =
        isServerError || isNetworkError || isRateLimited || isPermissionDenied || isApiKeyInvalid;

      if (shouldRetry) {
        const errorType = isPermissionDenied
          ? 'API not enabled'
          : (isApiKeyInvalid ? 'API key invalid/expired' : (error.message || 'Unknown error'));
        log.warn(
          `[Gemini] API Key #${keyIndex} failed (${error.status || error.code}): ${errorType}`
        );

        if (isPermissionDenied) {
          log.warn(`[Gemini] API Key #${keyIndex} needs API service enabled. Skipping to next key...`);
        }
        if (isApiKeyInvalid) {
          if (apiKey) disabledApiKeys.add(apiKey);
          log.warn(`[Gemini] API Key #${keyIndex} marked as disabled. Skipping to next key...`);
        }

        if (i < totalAttempts - 1) {
          const waitTime = isRateLimited ? delay * 2 : (isPermissionDenied || isApiKeyInvalid ? 0 : delay);
          if (waitTime > 0) {
            log.info(`[Gemini] Retrying with next key in ${waitTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
          continue;
        }
      }

      // Non-retryable error or last attempt
      throw error;
    }
  }

  throw lastError || new Error('All API keys exhausted');
};

const extractImage = (response: any) => {
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

const shouldLogGeminiUsage = (): boolean => {
  const raw = process.env.LOG_GEMINI_USAGE?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
};

const shouldLogGeminiUsageRaw = (): boolean => {
  const raw = process.env.LOG_GEMINI_USAGE_RAW?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
};

const GEMINI_STICKER_IMAGE_SIZE = (process.env.GEMINI_STICKER_IMAGE_SIZE || '512').trim();

const extractUsageMetadata = (response: any): Record<string, unknown> | null => {
  const usage =
    response?.usageMetadata ||
    response?.response?.usageMetadata ||
    response?.data?.usageMetadata ||
    response?.result?.usageMetadata;
  if (!usage || typeof usage !== 'object') return null;
  return usage as Record<string, unknown>;
};

const normalizeUsageMetadata = (usage: Record<string, unknown>): Record<string, number> => {
  const numeric: Record<string, number> = {};
  for (const [key, value] of Object.entries(usage)) {
    if (typeof value === 'number' && Number.isFinite(value)) numeric[key] = value;
  }

  const sumTokenDetails = (
    details: unknown,
    modality: 'IMAGE' | 'TEXT'
  ): number | undefined => {
    if (!Array.isArray(details)) return undefined;
    let sum = 0;
    let found = false;
    for (const entry of details) {
      const m = (entry as any)?.modality;
      const count = (entry as any)?.tokenCount;
      if (m === modality && typeof count === 'number' && Number.isFinite(count)) {
        sum += count;
        found = true;
      }
    }
    return found ? sum : undefined;
  };

  const promptTokensDetails = (usage as any)?.promptTokensDetails as unknown;
  const candidatesTokensDetails = (usage as any)?.candidatesTokensDetails as unknown;

  const promptTextTokens = sumTokenDetails(promptTokensDetails, 'TEXT');
  const promptImageTokens = sumTokenDetails(promptTokensDetails, 'IMAGE');
  const candidatesTextTokens = sumTokenDetails(candidatesTokensDetails, 'TEXT');
  const candidatesImageTokens = sumTokenDetails(candidatesTokensDetails, 'IMAGE');

  const imageInputTokens =
    numeric.imageInputTokenCount ?? numeric.imagePromptTokenCount ?? numeric.imagePromptTokens;
  const imageOutputTokens =
    numeric.imageOutputTokenCount ??
    numeric.imageOutputTokens ??
    numeric.imageCandidatesTokenCount ??
    numeric.imageCandidatesTokens;
  const textInputTokens =
    numeric.textInputTokenCount ?? numeric.textPromptTokenCount ?? numeric.promptTokenCount;
  const textOutputTokens =
    numeric.textOutputTokenCount ?? numeric.textCandidatesTokenCount ?? numeric.candidatesTokenCount;

  if (typeof promptImageTokens === 'number') numeric.image_input_tokens = promptImageTokens;
  else if (typeof imageInputTokens === 'number') numeric.image_input_tokens = imageInputTokens;

  if (typeof candidatesImageTokens === 'number') numeric.image_output_tokens = candidatesImageTokens;
  else if (typeof imageOutputTokens === 'number') numeric.image_output_tokens = imageOutputTokens;

  if (typeof promptTextTokens === 'number') numeric.text_input_tokens = promptTextTokens;
  else if (typeof textInputTokens === 'number') numeric.text_input_tokens = textInputTokens;

  if (typeof candidatesTextTokens === 'number') numeric.text_output_tokens = candidatesTextTokens;
  else if (typeof textOutputTokens === 'number') numeric.text_output_tokens = textOutputTokens;

  return numeric;
};

const logGeminiUsage = (params: { operation: string; model: string; response: any }): void => {
  if (!shouldLogGeminiUsage()) return;
  const usage = extractUsageMetadata(params.response);
  if (!usage) {
    log.info(`[GeminiUsage] ${params.operation} ${params.model}: (no usageMetadata)`);
    return;
  }
  log.info(
    `[GeminiUsageKeys] ${params.operation} ${params.model}: ${Object.keys(usage)
      .sort()
      .join(',')}`
  );
  if (shouldLogGeminiUsageRaw()) {
    log.info(`[GeminiUsageRaw] ${params.operation} ${params.model}: ${JSON.stringify(usage)}`);
  }
  const normalized = normalizeUsageMetadata(usage);
  log.info(`[GeminiUsage] ${params.operation} ${params.model}: ${JSON.stringify(normalized)}`);
};

// Remove legacy ensureApiKey - now handled by getNextApiKey()

export async function analyzeCharacter(params: {
  referenceImageBase64: string;
  userCategoryLabel: string;
}): Promise<string> {
  const cleanBase64 = params.referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let instructionSpecial = '';

  if (params.userCategoryLabel.includes('Family')) {
    instructionSpecial = `
      - **Family Mode (Adult & Child)**:
        Analyze the image containing an adult and a child. Describe BOTH characters in high detail:
        1. The Adult (Age, Hair, Clothes, Facial Features).
        2. The Child (Age, Hair, Clothes, Facial Features).
        Note their interaction vibe.
      `;
  } else if (params.userCategoryLabel.includes('Human & Pet')) {
    instructionSpecial = `
      - **Human & Pet Mode**:
        Analyze the image containing a human and a pet. Describe:
        1. The Human (Visual features).
        2. The Pet (Identify Species [Cat/Dog/etc.], Breed, Fur color, Pattern, Distinctive markings).
        Crucial: Extract the pet's breed details and markings accurately.
      `;
  } else if (params.userCategoryLabel.includes('Couple')) {
    instructionSpecial = `
    - **Couple Mode (Romantic)**:
      Analyze the image containing TWO people (Partner A and Partner B).
      Describe BOTH characters in detail.
      Note their romantic chemistry and interaction style.
    `;
  } else if (params.userCategoryLabel.includes('Duo')) {
    instructionSpecial = `
    - **Duo Mode (Friends)**:
      Analyze the image containing TWO people (Friend A and Friend B).
      Describe BOTH characters in detail.
      Note their friendly, platonic interaction vibe.
    `;
  } else {
    instructionSpecial = `
    - **Single Mode**:
       If Human: CRITICAL - Explicitly state the age category (Adult Female 25-35 years / Adult Male 30-40 years / Child 5-10 years / Elder 60+ years).
       Describe age-appropriate features:
       - For Adult Female: Mature facial features, elegant makeup, sophisticated hairstyle
       - For Adult Male: Masculine jaw, possible facial hair, mature expression
       - For Child: Round baby face, big innocent eyes, small nose, childlike proportions (big head ratio)
       - For Elder: Visible wrinkles, gray/white hair, glasses, age spots, gentle expression
       - Also note specific details (e.g. mole, glasses, beard style) to ensure resemblance.
       If Pet/Animal: Use [Species] [Breed] and describe specific fur patterns in detail.
    `;
  }

  const analysisPrompt = `
    Analyze the uploaded image to create a consistent character reference (DNA).
    The user has identified this character as a [${params.userCategoryLabel}].

    **CRITICAL REQUIREMENT - PRESERVE ORIGINAL APPEARANCE:**
    Your description will be used to generate stickers in DIFFERENT art styles.
    The art style will change, but the character's PHYSICAL FEATURES must stay EXACTLY the same.

    **INSTRUCTIONS:**
    1. **Start your description with**: "The character(s)..."
    ${instructionSpecial}

    2. **DETAILED FEATURE EXTRACTION (CRITICAL - Record EXACTLY as shown):**

       A. **Hairstyle & Hair Color** (EXACT description):
          - Hair length (short/shoulder-length/long)
          - Hair texture (straight/wavy/curly)
          - Exact hair color (e.g. "dark brown", "auburn with reddish tint")
          - Hairstyle details (e.g. "loose waves", "side part", "bangs")

       B. **Clothing** (EXACT description - this is CRITICAL):
          - Exact clothing type (e.g. "white knit sweater", "black suit jacket")
          - Clothing color and patterns (describe EXACTLY - e.g. "black and white horizontal striped shirt")
          - Neckline style, sleeve length
          - DO NOT invent traditional costumes (Hanfu, kimono) unless actually present
          - DO NOT change modern clothes to ancient clothes

       C. **Accessories** (EXACT description):
          - Jewelry (e.g. "yellow/gold beaded necklace")
          - Glasses, hats, earrings, watches (describe exactly if present)
          - DO NOT add accessories that don't exist

       D. **Distinctive Features** (EXACT description):
          - Beauty marks/moles (exact location)
          - Nail polish color
          - Makeup style (if visible)
          - Facial hair (for males)
          - Any unique identifiers

       E. **Facial Features**:
          - Face shape, eye shape, nose shape
          - Skin tone
          - Expression baseline

    3. **Consistency Rule**:
       - For Humans: If 'Adult', keep as Adult. If 'Child', keep as Child.
       - For Pets: Strictly describe the fur patterns and breed.
       - NEVER change the clothing era or style - modern stays modern, casual stays casual

    **FORMAT**: Write a dense paragraph covering ALL above points. Be PRECISE and DETAILED.
    Output ONLY the description paragraph.
  `;

  const response = await callApiWithRetry((apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    return ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [{ inlineData: { mimeType: 'image/png', data: cleanBase64 } }, { text: analysisPrompt }]
      }
    });
  });
  logGeminiUsage({ operation: 'analyzeCharacter', model: 'gemini-3-pro-preview', response });

  const description = response.text;
  if (!description) throw new Error('Failed to analyze character.');
  return description;
}

export async function generateStickerImage(params: {
  referenceImageBase64: string;
  characterDescription: string;
  promptDetail: string;
  styleId: StyleId;
}): Promise<string> {
  const cleanBase64 = params.referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const style = STYLES[params.styleId];
  const styleInjection = shouldUse3D(params.styleId) ? NANO_BANANA_STYLE : '';

  // Check if prompt explicitly includes "text bubble:" directive
  const hasTextBubble = /text\s+bubble\s*:/i.test(params.promptDetail);
  
  const textBubbleRule = hasTextBubble
    ? '- **Text Bubble**: Extract the text from "text bubble: ..." in the Action description and INCLUDE a speech bubble with that exact text. Make it expressive.'
    : '- **Text Bubble**: DO NOT include any speech bubble or text bubble in the image.';

  const fullPrompt = `
    You are an expert sticker designer using the advanced Gemini 3 Image Generation capabilities.

    **Character DNA (Strict Adherence):**
    ${params.characterDescription}

    **Action/Expression:**
    ${params.promptDetail}

    ${styleInjection ? `**Style Injection (Nano Banana Mode):**\n${styleInjection}\n` : ''}

    **Visual Style Extension (CRITICAL - MUST FOLLOW):**
    ${style.description}

    **CRITICAL CONSISTENCY RULES:**
    1. **IDENTITY LOCK**: You MUST draw the EXACT character described in the "Character DNA".
    2. **AGE/SPECIES CHECK**: Maintain the age (for humans) or species/breed (for pets) exactly.

    **FORMAT RULES:**
    - **Background**: Solid Light Gray Background (#E0E0E0). DO NOT use white background.
    - **Border**: Thick WHITE die-cut outline around the subject.
    ${textBubbleRule}
    - **Prohibition**: Strictly PROHIBIT writing the sticker's name/label (e.g. 'Goodnight', 'Work') as a caption or subtitle at the bottom of the image.
    - **Composition**: Single sticker, centered, high quality.
  `;

  try {
    try {
      const response = await callApiWithRetry((apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        return ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [{ inlineData: { mimeType: 'image/png', data: cleanBase64 } }, { text: fullPrompt }]
          },
          config: {
            imageConfig: { aspectRatio: '1:1', imageSize: GEMINI_STICKER_IMAGE_SIZE }
          }
        });
      });
      logGeminiUsage({ operation: 'generateStickerImage', model: 'gemini-3-pro-image-preview', response });

      const rawBase64 = extractImage(response);
      if (rawBase64) return rawBase64;
      log.warn(
        '[Gemini] gemini-3-pro-image-preview returned no inline image data; falling back to gemini-2.5-flash-image'
      );
    } catch (err: any) {
      if (err.message && err.message.includes('429')) throw err;
      log.warn(
        `[Gemini] gemini-3-pro-image-preview failed; falling back to gemini-2.5-flash-image (${err?.status || err?.code || 'unknown'}): ${err?.message || 'Unknown error'}`
      );
    }

    let responseFlash: any;
    try {
      responseFlash = await callApiWithRetry((apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        return ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ inlineData: { mimeType: 'image/png', data: cleanBase64 } }, { text: fullPrompt }]
          },
          config: { imageConfig: { aspectRatio: '1:1', imageSize: GEMINI_STICKER_IMAGE_SIZE } }
        });
      });
    } catch (err: any) {
      log.warn(
        `[Gemini] gemini-2.5-flash-image call with imageSize failed; retrying without imageSize (${err?.status || err?.code || 'unknown'}): ${err?.message || 'Unknown error'}`
      );
      responseFlash = await callApiWithRetry((apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        return ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ inlineData: { mimeType: 'image/png', data: cleanBase64 } }, { text: fullPrompt }]
          },
          config: { imageConfig: { aspectRatio: '1:1' } }
        });
      });
    }
    logGeminiUsage({ operation: 'generateStickerImage', model: 'gemini-2.5-flash-image', response: responseFlash });

    const rawBase64Flash = extractImage(responseFlash);
    if (!rawBase64Flash) throw new Error('No image data found in response.');
    return rawBase64Flash;
  } catch (error) {
    throw error;
  }
}

export async function generateStickerGrid(params: {
  referenceImageBase64: string;
  characterDescription: string;
  prompts: string[];
  styleId: StyleId;
  isSlaveBatch: boolean;
}): Promise<string> {
  const cleanBase64 = params.referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  if (params.prompts.length !== 4) {
    throw new Error('Batch generation requires exactly 4 prompts.');
  }

  let referenceInstruction = '';
  if (params.isSlaveBatch) {
    referenceInstruction = `
    **VISUAL CLONING MODE (HIGHEST PRIORITY):**
    The attached image is the **MASTER VISUAL REFERENCE** (a grid of stickers).
    You MUST generate new stickers for the **EXACT SAME CHARACTERS** shown in this master image.

    **MANDATORY CLONING RULES:**
    1. **CLOTHING LOCK**: You MUST COPY the clothing details (colors, patterns, sleeves) EXACTLY from the attached image. Do not change them.
    2. **STYLE LOCK**: Use the exact same line width, color palette, and shading style.
    3. **OVERRIDE**: If the "Character DNA" text below conflicts with the visuals in the attached image, **IGNORE THE TEXT AND FOLLOW THE IMAGE**.
    `;
  } else {
    referenceInstruction = `
    **REFERENCE INSTRUCTION:**
    Use the attached photo as the character reference.
    Transform this character into the requested style.
    `;
  }

  const style = STYLES[params.styleId];
  const styleInjection = shouldUse3D(params.styleId) ? NANO_BANANA_STYLE : '';

  // Check if any prompt explicitly includes "text bubble:" directive
  const hasAnyTextBubble = params.prompts.some(prompt => /text\s+bubble\s*:/i.test(prompt));
  
  const textBubbleRule = hasAnyTextBubble
    ? '- **Text Bubble**: For each sticker, if its Action description includes "text bubble: ...", extract that text and INCLUDE a speech bubble with that exact text. For stickers without "text bubble:", DO NOT include any speech bubble.'
    : '- **Text Bubble**: DO NOT include any speech bubble or text bubble in any of the 4 stickers.';

  const gridPrompt = `
    You are an expert sticker designer using the advanced Gemini 3 Image Generation capabilities.
    Create a 2x2 GRID image containing 4 distinct die-cut stickers.

    ${referenceInstruction}

    **Character DNA (Identity Lock):**
    ${params.characterDescription}

    ${styleInjection ? `**Style Injection (Nano Banana Mode):**\n${styleInjection}\n` : ''}

    **Visual Style Extension:** ${style.description}

    **Grid Layout & Actions:**
    - Top Left: ${params.prompts[0]}
    - Top Right: ${params.prompts[1]}
    - Bottom Left: ${params.prompts[2]}
    - Bottom Right: ${params.prompts[3]}

    **CRITICAL RULES:**
    1. **IDENTITY LOCK**: All 4 stickers must depict the SAME person/animal described above.
    2. **AGE/SPECIES CHECK**: If DNA says "Adult", ALL stickers must be ADULTS. If "Cat", all must be CATS.
    3. **NO CAPTIONS**: Strictly PROHIBIT writing label names (e.g. 'Goodnight') as subtitles.

    **FORMAT RULES:**
    - **Background**: Solid Light Gray Background (#E0E0E0). DO NOT use white background.
    - **Border**: Thick WHITE die-cut outline around each sticker.
    ${textBubbleRule}
    - **Layout**: Strict 2x2 grid, non-overlapping.
  `;

  const response = await callApiWithRetry((apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    return ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ inlineData: { mimeType: 'image/png', data: cleanBase64 } }, { text: gridPrompt }]
      },
      config: {
        imageConfig: { aspectRatio: '1:1', imageSize: GEMINI_STICKER_IMAGE_SIZE }
      }
    });
  });
  logGeminiUsage({ operation: 'generateStickerGrid', model: 'gemini-3-pro-image-preview', response });

  const rawBase64 = extractImage(response);
  if (!rawBase64) throw new Error('No grid image generated.');
  return rawBase64;
}

// ==================== 微信审核资源生成 ====================

/**
 * 生成微信审核横幅 (750x400)
 */
export async function generateReviewBanner(params: {
  referenceImageBase64: string;
  characterDescription: string;
  styleId: StyleId;
}): Promise<string> {
  const cleanBase64 = params.referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const style = STYLES[params.styleId];

  const bannerPrompt = `
You are creating a WeChat sticker pack BANNER for 审核 (review) submission.

**Character DNA (Strict Adherence):**
${params.characterDescription}

**Visual Style:** ${style.description}

**CRITICAL WeChat Banner Requirements:**
1. **Aspect Ratio**: MUST be HORIZONTAL BANNER (wider than tall, approximately 16:10 or 3:2 ratio)
2. **Composition**: Show the character in a STORYTELLING SCENE with rich background
   - Character doing an engaging activity (celebrating, playing, traveling, partying, dancing, etc.)
   - Include environmental elements (decorations, props, scenery, objects, confetti, flowers)
   - Create a narrative moment with ACTION and EMOTION, not just a static portrait
   - The character can interact with objects or the environment
3. **Color Tone**: VIBRANT, LIVELY, and COLORFUL
   - AVOID pure white backgrounds (#FFFFFF)
   - Use colorful gradient backgrounds (sunset, rainbow, festive colors) or rich scene colors
   - Ensure good contrast with WeChat UI colors
   - Bright, cheerful, eye-catching color palette
4. **Content Rules (CRITICAL):**
   - STRICTLY NO TEXT - no words, labels, captions, Chinese characters, or any written text
   - NO transparent areas - must be fully OPAQUE image
   - Character proportions should NOT be distorted or stretched
   - Avoid violence, politics, or sensitive content
5. **Mood**: Happy, energetic, engaging, inviting, fun
6. **Background**: Light Gray (#E0E0E0) with white border (will create opaque final image)

**Output**: Horizontal banner image (wider than tall), colorful storytelling scene, fully opaque, NO TEXT.
  `;

  const response = await callApiWithRetry((apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    return ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: bannerPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9',  // 横向比例
          imageSize: '1024'
        }
      }
    });
  });

  logGeminiUsage({ operation: 'generateReviewBanner', model: 'gemini-3-pro-image-preview', response });

  const rawBase64 = extractImage(response);
  if (!rawBase64) throw new Error('Failed to generate banner image');
  return rawBase64;
}

/**
 * 生成微信审核封面 (240x240, 透明背景)
 */
export async function generateReviewCover(params: {
  referenceImageBase64: string;
  characterDescription: string;
  styleId: StyleId;
}): Promise<string> {
  const cleanBase64 = params.referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const style = STYLES[params.styleId];

  const coverPrompt = `
You are creating a WeChat sticker pack COVER for 审核 (review) submission.

**Character DNA (Strict Adherence):**
${params.characterDescription}

**Visual Style:** ${style.description}

**CRITICAL WeChat Cover Requirements:**
1. **Aspect Ratio**: MUST be 1:1 SQUARE (240x240)
2. **Composition**: Character HALF-BODY or FULL-BODY portrait
   - Show the most RECOGNIZABLE and ICONIC representation of the character
   - Center the character, facing forward or 3/4 view
   - Include upper body (from chest/waist up) OR full body (head to toe)
   - Character should be in a neutral or signature pose
3. **Background (CRITICAL for transparent processing)**:
   - MUST BE SOLID LIGHT GRAY (#E0E0E0) background
   - DO NOT use pure white (#FFFFFF) or other colors
   - This gray background will be removed to create transparency later
4. **Border**: Thick WHITE die-cut outline around the character (same as regular stickers)
5. **Style**: Simple, clean, focused ONLY on the character
   - AVOID decorative elements, props, or busy backgrounds
   - AVOID text bubbles or written text (unless character is a pure text meme)
   - Minimize accessories and decorations
6. **Edge Treatment (CRITICAL for transparent processing)**:
   - NO white glow, halo, or shadow around character edges
   - Clean, sharp anti-aliased edges
   - NO jagged pixelation or rough edges
   - The white outline should be part of the character, not a separate glow
7. **Content**: The character should be clearly visible and recognizable at small sizes

**Output**: 1:1 square portrait, gray (#E0E0E0) background, thick white outline, half/full body pose.
  `;

  const response = await callApiWithRetry((apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    return ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: coverPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: GEMINI_STICKER_IMAGE_SIZE
        }
      }
    });
  });

  logGeminiUsage({ operation: 'generateReviewCover', model: 'gemini-3-pro-image-preview', response });

  const rawBase64 = extractImage(response);
  if (!rawBase64) throw new Error('Failed to generate cover image');
  return rawBase64;
}

/**
 * 生成微信审核图标 (50x50, 透明背景)
 */
export async function generateReviewIcon(params: {
  referenceImageBase64: string;
  characterDescription: string;
  styleId: StyleId;
}): Promise<string> {
  const cleanBase64 = params.referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const style = STYLES[params.styleId];

  const iconPrompt = `
You are creating a WeChat sticker pack ICON for 审核 (review) submission.

**Character DNA (Strict Adherence):**
${params.characterDescription}

**Visual Style:** ${style.description}

**CRITICAL WeChat Icon Requirements:**
1. **Aspect Ratio**: MUST be 1:1 SQUARE (50x50)
2. **Composition**: Character HEAD ONLY close-up portrait (face/head shot)
   - Show ONLY the head and face (from neck up or just the face area)
   - Direct front view or slight 3/4 angle for clarity
   - EXTREME SIMPLICITY - this will be displayed at tiny 50x50 size
   - Focus on the most distinctive facial features
3. **Background (CRITICAL for transparent processing)**:
   - MUST BE SOLID LIGHT GRAY (#E0E0E0) background
   - DO NOT use pure white (#FFFFFF) or other colors
   - This gray background will be removed to create transparency later
4. **Border**: Thick WHITE die-cut outline around the head (same as regular stickers)
5. **Style**: ULTRA-SIMPLE, clear, recognizable at TINY size
   - AVOID complex details, intricate decorations, or small accessories (except signature items like glasses)
   - AVOID sharp 90-degree corners or square frames
   - Minimize background elements to ZERO
   - Keep facial features simple and bold
6. **Edge Treatment (CRITICAL for transparent processing)**:
   - NO white glow, halo, or shadow around edges
   - Clean, sharp anti-aliased edges
   - NO jagged pixelation
   - The white outline should be crisp and part of the character design
7. **Clarity**: Must be clearly recognizable even at 50x50 pixels

**Output**: 1:1 square head portrait, gray (#E0E0E0) background, minimal details, thick white outline.
  `;

  const response = await callApiWithRetry((apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    return ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: iconPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: GEMINI_STICKER_IMAGE_SIZE  // 生成较大尺寸，前端缩放到50x50
        }
      }
    });
  });

  logGeminiUsage({ operation: 'generateReviewIcon', model: 'gemini-3-pro-image-preview', response });

  const rawBase64 = extractImage(response);
  if (!rawBase64) throw new Error('Failed to generate icon image');
  return rawBase64;
}
