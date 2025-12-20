import { GoogleGenAI } from '@google/genai';

const KEY = 'AIzaSyAEsyYN8bSdvlA8wZQJAjE-gRiZ6azFsjg';
const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

console.log('测试不同的Gemini模型...\n');

// Test 1: gemini-3-pro-image-preview (你代码中使用的)
console.log('1. 测试 gemini-3-pro-image-preview (当前使用的主模型)...');
try {
  const ai = new GoogleGenAI({ apiKey: KEY });
  const start = Date.now();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: testImage } },
        { text: 'Generate a blue circle' }
      ]
    },
    config: { imageConfig: { aspectRatio: '1:1', imageSize: '2K' } }
  });
  const elapsed = Date.now() - start;
  console.log(`✓ 成功 (耗时: ${elapsed}ms)\n`);
} catch (error) {
  console.log(`✗ 失败: ${error.status || error.code} - ${error.message}`);
  console.log(`   这就是你遇到的503错误！\n`);
}

// Test 2: gemini-2.5-flash-image (备用模型)
console.log('2. 测试 gemini-2.5-flash-image (备用模型)...');
try {
  const ai = new GoogleGenAI({ apiKey: KEY });
  const start = Date.now();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: testImage } },
        { text: 'Generate a blue circle' }
      ]
    },
    config: { imageConfig: { aspectRatio: '1:1' } }
  });
  const elapsed = Date.now() - start;
  console.log(`✓ 成功 (耗时: ${elapsed}ms)\n`);
} catch (error) {
  console.log(`✗ 失败: ${error.status || error.code} - ${error.message}\n`);
}

// Test 3: gemini-3-pro-preview (文本分析)
console.log('3. 测试 gemini-3-pro-preview (角色分析用)...');
try {
  const ai = new GoogleGenAI({ apiKey: KEY });
  const start = Date.now();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: testImage } },
        { text: 'Describe this image in 5 words' }
      ]
    }
  });
  const elapsed = Date.now() - start;
  console.log(`✓ 成功 (耗时: ${elapsed}ms) - ${response.text}\n`);
} catch (error) {
  console.log(`✗ 失败: ${error.status || error.code} - ${error.message}\n`);
}

console.log('='.repeat(60));
console.log('结论:');
console.log('如果 gemini-3-pro-image-preview 失败，说明该模型当前不可用');
console.log('建议: 切换到 gemini-2.5-flash-image 或其他可用模型');
