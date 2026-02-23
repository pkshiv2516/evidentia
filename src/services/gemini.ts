import { GoogleGenAI } from "@google/genai";
import { CIPF_SYSTEM_INSTRUCTION, CIPFReport } from "../lib/cipf";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeProblem(problem: string): Promise<CIPFReport> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following problem statement using the CIPF framework and historical evidence: "${problem}"`,
    config: {
      systemInstruction: CIPF_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      maxOutputTokens: 800,
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse JSON response", response.text);
    throw new Error("Invalid response format from AI");
  }
}

export async function editImage(base64Image: string, prompt: string, mimeType: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(',')[1] || base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
}
