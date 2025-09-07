
import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse, Part } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const base64ToGenerativePart = (base64: string, mimeType: string): Part => {
    return {
        inlineData: { data: base64, mimeType: mimeType },
    };
};

const extractImageFromResponse = (response: GenerateContentResponse): string => {
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }
    }
    throw new Error("API response did not contain an image.");
}

export const isolateLogo = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                imagePart,
                { text: 'From this image, perfectly crop and isolate the "TechPro" logo. The logo has a stylized arrow-like icon to the left of the text. Return only the complete logo on a transparent background.' },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageFromResponse(response);
};

export const generateMockup = async (logoBase64: string, prompt: string): Promise<string> => {
    const logoPart = base64ToGenerativePart(logoBase64, 'image/png'); 
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                logoPart,
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageFromResponse(response);
};
