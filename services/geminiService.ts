
import { GoogleGenAI, Type } from "@google/genai";
import { GiftSuggestion, Language } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateGiftSuggestions = async (
  recipientName: string,
  recipientWishlist: string[],
  lang: Language = 'en'
): Promise<GiftSuggestion[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  const wishlistText = recipientWishlist.length > 0 
    ? recipientWishlist.join(', ') 
    : "No specific wishes listed, surprise them based on general popularity.";

  let languageInstruction = "Response MUST be in English.";
  switch (lang) {
    case 'zh':
      languageInstruction = "Response MUST be in Traditional Chinese (Taiwan).";
      break;
    case 'ja':
      languageInstruction = "Response MUST be in Japanese.";
      break;
    case 'ko':
      languageInstruction = "Response MUST be in Korean.";
      break;
    case 'es':
      languageInstruction = "Response MUST be in Spanish.";
      break;
    default:
      languageInstruction = "Response MUST be in English.";
  }

  const prompt = `
    I am participating in a Secret Santa.
    My recipient is named ${recipientName}.
    Their wishlist contains: ${wishlistText}.
    
    Please suggest 3 creative, thoughtful, and appropriate gift ideas. 
    If the wishlist is empty, suggest generally popular but unique items.
    If the wishlist exists, suggest specific items that match the vibe or are direct variations/upgrades.
    
    ${languageInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING, description: "Name of the gift item" },
              reason: { type: Type.STRING, description: "Why this is a good match" },
              estimatedPrice: { type: Type.STRING, description: "Estimated price range (e.g. $20-$30 or NT$500-1000)" }
            },
            required: ["item", "reason", "estimatedPrice"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    return JSON.parse(jsonText) as GiftSuggestion[];
  } catch (error) {
    console.error("Failed to generate gift suggestions:", error);
    return [];
  }
};
