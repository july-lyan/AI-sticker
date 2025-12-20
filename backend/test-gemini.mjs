import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key:', apiKey ? '✓ Found' : '✗ Not found');

try {
  const ai = new GoogleGenAI({ apiKey });
  console.log('Testing model availability...');
  
  // Test text model
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: 'Say hi' }] }
    });
    console.log('✓ gemini-3-pro-preview works:', response.text.substring(0, 50));
  } catch (e) {
    console.log('✗ gemini-3-pro-preview error:', e.message);
  }
  
  // Test image model
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: 'Generate a simple red circle' }] },
      config: { imageConfig: { aspectRatio: '1:1' } }
    });
    console.log('✓ gemini-3-pro-image-preview works');
  } catch (e) {
    console.log('✗ gemini-3-pro-image-preview error:', e.message);
  }
  
  // Test alternative image model
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: 'Generate a simple red circle' }] },
      config: { imageConfig: { aspectRatio: '1:1' } }
    });
    console.log('✓ gemini-2.5-flash-image works');
  } catch (e) {
    console.log('✗ gemini-2.5-flash-image error:', e.message);
  }
  
} catch (error) {
  console.error('Fatal error:', error.message);
}
