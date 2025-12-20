import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEYS } from '../utils/env.js';
import { STYLES, type StyleId } from '../constants/styles.js';
import { log } from '../utils/logger.js';

// API Key rotation state
let currentKeyIndex = 0;

function getNextApiKey(): string {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('Missing GEMINI_API_KEY in environment variables');
  }
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

function getAllApiKeys(): string[] {
  return [...GEMINI_API_KEYS];
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

const callApiWithRetry = async <T>(
  fn: (apiKey: string) => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> => {
  const allKeys = getAllApiKeys();
  const totalAttempts = Math.min(retries + 1, allKeys.length * 2); // Try each key at least once
  let lastError: any;

  for (let i = 0; i < totalAttempts; i++) {
    const apiKey = getNextApiKey();
    const keyIndex = GEMINI_API_KEYS.indexOf(apiKey) + 1;

    try {
      log.info(`[Gemini] Using API Key #${keyIndex} (attempt ${i + 1}/${totalAttempts})`);
      return await fn(apiKey);
    } catch (error: any) {
      lastError = error;
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
      const shouldRetry = isServerError || isNetworkError || isRateLimited || isPermissionDenied;

      if (shouldRetry) {
        const errorType = isPermissionDenied ? 'API not enabled' : error.message || 'Unknown error';
        log.warn(
          `[Gemini] API Key #${keyIndex} failed (${error.status || error.code}): ${errorType}`
        );

        if (isPermissionDenied) {
          log.warn(`[Gemini] API Key #${keyIndex} needs API service enabled. Skipping to next key...`);
        }

        if (i < totalAttempts - 1) {
          const waitTime = isRateLimited ? delay * 2 : (isPermissionDenied ? 0 : delay);
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
    - **Text Bubble**: If the Action description includes text (e.g. "哈哈", "Hi", "困"), INCLUDE a speech bubble with that exact text. Make it expressive.
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
            imageConfig: { aspectRatio: '1:1', imageSize: '2K' }
          }
        });
      });

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

    const responseFlash = await callApiWithRetry((apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      return ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ inlineData: { mimeType: 'image/png', data: cleanBase64 } }, { text: fullPrompt }]
        },
        config: { imageConfig: { aspectRatio: '1:1' } }
      });
    });

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
    3. **NO CAPTIONS**: Strictly PROHIBIT writing label names (e.g. 'Goodnight') as subtitles. Text inside bubbles is allowed.

    **FORMAT RULES:**
    - **Background**: Solid Light Gray Background (#E0E0E0). DO NOT use white background.
    - **Border**: Thick WHITE die-cut outline around each sticker.
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
        imageConfig: { aspectRatio: '1:1', imageSize: '2K' }
      }
    });
  });

  const rawBase64 = extractImage(response);
  if (!rawBase64) throw new Error('No grid image generated.');
  return rawBase64;
}
