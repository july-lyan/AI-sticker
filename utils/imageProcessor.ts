
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
