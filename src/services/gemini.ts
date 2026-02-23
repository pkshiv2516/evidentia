import { GoogleGenAI } from "@google/genai";
import { CIPF_SYSTEM_INSTRUCTION, CIPFReport } from "../lib/cipf";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeProblem(problem: string): Promise<CIPFReport> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Analyze the following problem statement using the CIPF framework and historical evidence: "${problem}". ALWAYS return your response as raw, valid JSON with no markdown formatting.`,
    config: {
      systemInstruction: CIPF_SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      maxOutputTokens: 800,
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  try {
    // Strip potential markdown backticks simply
    let cleanText = response.text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return JSON.parse(cleanText.trim());
  } catch (e) {
    console.error("Failed to parse JSON response", response.text);
    throw new Error("Invalid response format from AI");
  }
}

export async function editImage(base64Image: string, prompt: string, mimeType: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
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
