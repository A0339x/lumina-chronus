import { GoogleGenAI } from "@google/genai";
import { CelebrationMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Cache to prevent spamming API on every render or quick refreshes
const cache: Record<string, CelebrationMessage> = {};

export const getCelebrationContent = async (region: string, cities: string[], specificCity?: string): Promise<CelebrationMessage> => {
  const cacheKey = specificCity ? `${region}-CITY-${specificCity}` : `${region}-MAIN`;
  
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const modelId = "gemini-3-flash-preview"; 
    
    let prompt = "";
    
    if (specificCity) {
        prompt = `
          The user has selected the city of ${specificCity} (Timezone Region: ${region}).
          They are celebrating New Year's Eve (or approaching midnight).

          Generate a JSON object with two fields:
          1. "greeting": A short, festive New Year greeting suitable for ${specificCity} (in English, but referencing local language/slang if applicable). Max 15 words.
          2. "culturalFact": A fascinating, one-sentence fun fact about specific New Year's traditions, landmarks at midnight, or nightlife in ${specificCity}. Max 25 words.

          Do not include markdown code blocks. Just the JSON.
        `;
    } else {
        prompt = `
          The following region is about to celebrate New Year's Eve (or midnight): ${region}.
          Major cities include: ${cities.slice(0, 5).join(', ')}.
          
          Generate a JSON object with two fields:
          1. "greeting": A short, festive New Year greeting suitable for this region (in English, but maybe referencing local language if applicable). Max 15 words.
          2. "culturalFact": A fascinating, one-sentence fun fact about how New Year's or midnight is celebrated in this specific region or one of its cities. Max 25 words.
          
          Do not include markdown code blocks. Just the JSON.
        `;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text) as CelebrationMessage;
    
    // simple validation
    if(data.greeting && data.culturalFact) {
        cache[cacheKey] = data;
        return data;
    }
    throw new Error("Invalid JSON structure");

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback content
    const target = specificCity || region;
    return {
      greeting: `Happy New Year, ${target}!`,
      culturalFact: "As the clock strikes twelve, the world celebrates new beginnings together."
    };
  }
};