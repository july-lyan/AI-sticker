
import { removeBackground } from '@imgly/background-removal';

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return res.blob();
};

/**
 * Flood Fill Background Removal (Fallback)
 * Starts from the corners and removes the connected background color.
 * Used when the AI model fails or times out.
 */
export const removeBackgroundFloodFill = (base64Data: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(base64Data);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Sample background color from top-left
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      const visited = new Uint8Array(width * height);
      const stack: [number, number][] = [
        [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]
      ];
      
      // Tolerance lowered to 25 (from 60)
      // Since we now generate a Gray background (#E0E0E0) and a White Border (#FFFFFF),
      // the euclidean distance is ~53. 
      // A tolerance of 25 safely removes the background/noise but stops firmly at the white border.
      const tolerance = 25; 

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const idx = y * width + x;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const pixelPos = idx * 4;
        const r = data[pixelPos];
        const g = data[pixelPos + 1];
        const b = data[pixelPos + 2];

        // Euclidean distance
        const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
        
        if (dist <= tolerance) {
          data[pixelPos + 3] = 0; // Set Alpha to 0

          if (x > 0) stack.push([x - 1, y]);
          if (x < width - 1) stack.push([x + 1, y]);
          if (y > 0) stack.push([x, y - 1]);
          if (y < height - 1) stack.push([x, y + 1]);
        }
      }
      
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      console.warn("Flood fill failed to load image", e);
      resolve(base64Data);
    };
    img.src = base64Data;
  });
};

/**
 * Smart Background Removal.
 * Tries @imgly/background-removal first (high quality).
 * Falls back to FloodFill (algorithmic) if it fails.
 */
export const removeBackgroundSmart = async (base64Image: string): Promise<string> => {
  try {
    const blob = await base64ToBlob(base64Image);
    // Use imgly to remove background
    const transparentBlob = await removeBackground(blob, {
      // CORRECT PUBLIC PATH FOR ASSETS (WASM + Models)
      publicPath: 'https://static.img.ly/background-removal-data/1.5.0/dist/',
      progress: (key: string, current: number, total: number) => {
         // console.debug(`BG Removal ${key}: ${current}/${total}`);
      }
    });
    return await blobToBase64(transparentBlob);
  } catch (error) {
    console.warn("Smart BG removal failed/timed out, falling back to FloodFill.", error);
    return await removeBackgroundFloodFill(base64Image);
  }
};

/**
 * Slices a 2x2 grid image into 4 separate images.
 * Order: Top-Left, Top-Right, Bottom-Left, Bottom-Right.
 */
export const sliceGrid2x2 = async (base64Image: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = Math.floor(img.width / 2);
      const h = Math.floor(img.height / 2);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const pieces: string[] = [];
      const coords = [
        [0, 0],     // Top-Left
        [w, 0],     // Top-Right
        [0, h],     // Bottom-Left
        [w, h]      // Bottom-Right
      ];

      try {
        coords.forEach(([x, y]) => {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          pieces.push(canvas.toDataURL('image/png'));
        });
        resolve(pieces);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = base64Image;
  });
};

/**
 * Generates a marketing sheet (poster) combining all stickers.
 */
export const generateMarketingSheet = async (
  imagesBase64: string[],
  title: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error("No 2d context"));
      return;
    }

    const COLUMNS = 3;
    const ROWS = 4; // 12 stickers
    const IMAGE_SIZE = 512;
    const GAP = 40;
    const PADDING_X = 60;
    const PADDING_Y = 60;
    // Removed Header Height since title is removed
    const HEADER_HEIGHT = 0; 

    const width = PADDING_X * 2 + (IMAGE_SIZE * COLUMNS) + (GAP * (COLUMNS - 1));
    const height = PADDING_Y * 2 + (IMAGE_SIZE * ROWS) + (GAP * (ROWS - 1));

    canvas.width = width;
    canvas.height = height;

    // Background - Pure White
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    let loadedCount = 0;
    // Limit to 12
    const imagesToDraw = imagesBase64.slice(0, 12);

    if (imagesToDraw.length === 0) {
        resolve(canvas.toDataURL('image/png'));
        return;
    }

    imagesToDraw.forEach((base64, index) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const col = index % COLUMNS;
        const row = Math.floor(index / COLUMNS);

        const x = PADDING_X + col * (IMAGE_SIZE + GAP);
        const y = PADDING_Y + row * (IMAGE_SIZE + GAP);

        // Draw shadow for stickers
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // Draw image
        ctx.drawImage(img, x, y, IMAGE_SIZE, IMAGE_SIZE);
        ctx.restore();

        loadedCount++;
        if (loadedCount === imagesToDraw.length) {
          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.onerror = (e) => {
          console.error("Failed to load sticker for sheet", e);
          loadedCount++;
           if (loadedCount === imagesToDraw.length) {
            resolve(canvas.toDataURL('image/png'));
          }
      }
      img.src = base64;
    });
  });
};

// ==================== 微信审核资源图片处理 ====================

/**
 * 调整图片尺寸到精确像素
 */
export const resizeImage = async (
  base64Image: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 使用高质量缩放算法
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 绘制缩放后的图片
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      console.error('Image resize failed:', e);
      reject(e);
    };
    img.src = base64Image;
  });
};

/**
 * 压缩图片到指定文件大小以下
 */
export const compressImage = async (
  base64Image: string,
  maxSizeKB: number,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Image);
        return;
      }

      ctx.drawImage(img, 0, 0);

      // 尝试不同质量级别直到满足大小要求
      let quality = 0.95;
      let result = canvas.toDataURL(format, quality);

      // base64 编码膨胀系数约为 1.37
      const targetSize = maxSizeKB * 1024 * 1.37;

      while (result.length > targetSize && quality > 0.1) {
        quality -= 0.05;
        result = canvas.toDataURL(format, quality);
      }

      console.log(`Compressed image: quality=${quality.toFixed(2)}, size=${(result.length / 1024).toFixed(2)}KB`);
      resolve(result);
    };
    img.onerror = () => {
      console.warn('Image compression failed, returning original');
      resolve(base64Image);
    };
    img.src = base64Image;
  });
};

type AutoCropOptions = {
  targetSize: number;
  alphaThreshold?: number;
  paddingRatio?: number;
  biasY?: number; // -1..1, negative = shift crop up
  background?: string; // fill color for transparent padding
  sharpen?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const sharpenImageData = (imgData: ImageData): ImageData => {
  const { data, width, height } = imgData;
  const out = new Uint8ClampedArray(data.length);
  // simple unsharp-like kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  const idx = (x: number, y: number) => (y * width + x) * 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let ki = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const sx = clamp(x + kx, 0, width - 1);
          const sy = clamp(y + ky, 0, height - 1);
          const wgt = kernel[ki++];
          const p = idx(sx, sy);
          r += data[p] * wgt;
          g += data[p + 1] * wgt;
          b += data[p + 2] * wgt;
          a += data[p + 3] * wgt;
        }
      }
      const p = idx(x, y);
      out[p] = clamp(r, 0, 255);
      out[p + 1] = clamp(g, 0, 255);
      out[p + 2] = clamp(b, 0, 255);
      out[p + 3] = clamp(a, 0, 255);
    }
  }

  return new ImageData(out, width, height);
};

/**
 * Auto-crop a transparent image to its non-transparent bounds, then fit into a square.
 * Designed for WeChat review cover/icon so the subject fills the frame and stays readable.
 */
export const autoCropToSquare = async (
  base64Image: string,
  options: AutoCropOptions
): Promise<string> => {
  const {
    targetSize,
    alphaThreshold = 12,
    paddingRatio = 0.12,
    biasY = 0,
    background = 'transparent',
    sharpen = false
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.width;
      srcCanvas.height = img.height;
      const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
      if (!srcCtx) return resolve(base64Image);
      srcCtx.drawImage(img, 0, 0);

      const data = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
      const { width, height } = data;

      let minX = width, minY = height, maxX = -1, maxY = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const a = data.data[(y * width + x) * 4 + 3];
          if (a > alphaThreshold) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      // If nothing found, fall back.
      if (maxX < minX || maxY < minY) return resolve(base64Image);

      const bboxW = maxX - minX + 1;
      const bboxH = maxY - minY + 1;
      const pad = Math.round(Math.max(bboxW, bboxH) * paddingRatio);
      minX = clamp(minX - pad, 0, width - 1);
      minY = clamp(minY - pad, 0, height - 1);
      maxX = clamp(maxX + pad, 0, width - 1);
      maxY = clamp(maxY + pad, 0, height - 1);

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      const side = Math.max(cropW, cropH);

      const centerX = minX + cropW / 2;
      const centerY = minY + cropH / 2 + biasY * (side * 0.25);
      let sx = Math.round(centerX - side / 2);
      let sy = Math.round(centerY - side / 2);
      sx = clamp(sx, 0, width - side);
      sy = clamp(sy, 0, height - side);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = targetSize;
      outCanvas.height = targetSize;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return resolve(base64Image);

      if (background !== 'transparent') {
        outCtx.fillStyle = background;
        outCtx.fillRect(0, 0, targetSize, targetSize);
      } else {
        outCtx.clearRect(0, 0, targetSize, targetSize);
      }

      outCtx.imageSmoothingEnabled = true;
      outCtx.imageSmoothingQuality = 'high';
      outCtx.drawImage(srcCanvas, sx, sy, side, side, 0, 0, targetSize, targetSize);

      if (sharpen) {
        try {
          const outData = outCtx.getImageData(0, 0, targetSize, targetSize);
          outCtx.putImageData(sharpenImageData(outData), 0, 0);
        } catch {
          // ignore
        }
      }

      resolve(outCanvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(base64Image);
    img.src = base64Image;
  });
};
