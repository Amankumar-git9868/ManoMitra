import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Testing key:', apiKey ? (apiKey.substring(0, 8) + '...') : 'none');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    for (let i = 0; i < 3; i++) {
      console.log(`\nAttempt ${i + 1} with gemini-flash-latest`);
      try {
        const result = await model.generateContent('Say hello!');
        console.log(`✅ Success! Response: ${result.response.text()}`);
        return;
      } catch (err) {
        console.error(`❌ Failed: ${err.message}`);
        await new Promise(res => setTimeout(res, 2000));
      }
    }
    
  } catch (err) {
    console.error('Error during test:', err);
  }
};

test();
