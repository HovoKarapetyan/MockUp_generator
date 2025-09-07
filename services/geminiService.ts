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
                { text: 'Analyze the uploaded image and identify the primary logo. The logo may be on a complex background with other elements. Your task is to precisely extract only the logo (including any text and graphical elements that are part of it) and completely remove its original background. The final output must be an image of the logo on a perfectly transparent background (alpha channel). Do not include any shadows or artifacts from the original background.' },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageFromResponse(response);
};

const LOGO_STYLE_PROMPTS: { [key: string]: string } = {
    'minimalist': 'Recreate the provided logo in a minimalist, flat design style. Simplify the shapes and use a very limited, modern color palette. Ensure the output is clean and professional. The output must be only the logo on a transparent background.',
    'retro': 'Transform the provided logo into a retro 80s or 90s style. Use bold outlines, vibrant neon colors, chrome effects, and a vintage aesthetic reminiscent of that era. The output must be only the logo on a transparent background.',
    'futuristic': 'Redesign the provided logo with a futuristic, cyberpunk aesthetic. Incorporate sleek metallic textures, sharp geometric angles, and glowing neon or holographic elements. The output must be only the logo on a transparent background.',
    'hand-drawn': 'Reimagine the provided logo as if it were hand-drawn, sketched, or painted. Give it an organic, imperfect, and artistic feel, like a brushstroke or pencil sketch. The output must be only the logo on a transparent background.',
    'geometric': 'Reconstruct the provided logo using simple geometric shapes like circles, squares, and triangles. Create a clean, abstract, and balanced composition. The output must be only the logo on a transparent background.',
    'abstract': 'Convert the provided logo into an abstract form. Deconstruct its elements and rearrange them into a new, artistic, and non-representational composition while retaining the original\'s essence and color palette. The output must be only the logo on a transparent background.',
    'vintage': 'Give the provided logo a vintage, distressed look. Apply faded colors, worn textures, and a classic typography style to make it look like an authentic logo from the 1950s or 1960s. The output must be only the logo on a transparent background.',
    '3d-render': 'Render the provided logo as a realistic 3D object. Give it depth, realistic materials (like glossy plastic or brushed metal), and dynamic lighting and shadows to make it pop. The output must be only the logo on a transparent background.'
};

export const generateLogoVariation = async (logoBase64: string, style: string): Promise<string> => {
    const prompt = LOGO_STYLE_PROMPTS[style];
    if (!prompt) {
        throw new Error(`Invalid style provided: ${style}`);
    }

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


export const generateMockup = async (logoBase64: string, prompt: string, backgroundBase64?: string): Promise<string> => {
    const logoPart = base64ToGenerativePart(logoBase64, 'image/png');
    const parts: Part[] = [logoPart];

    if (backgroundBase64) {
        // Assuming the background is a PNG or JPEG. The user's browser will provide the correct mime type in the data URL.
        const backgroundPart = base64ToGenerativePart(backgroundBase64, 'image/png');
        parts.push(backgroundPart);
    }
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts,
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageFromResponse(response);
};

export const generateVideoMockup = async (
    logoBase64: string, 
    prompt: string,
    onProgress: (progress: number, message: string) => void,
): Promise<string> => {
    onProgress(0, 'Submitting video request...');
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: logoBase64,
            mimeType: 'image/png',
        },
        config: {
            numberOfVideos: 1
        }
    });

    onProgress(5, 'Preparing video...');

    while (!operation.done) {
        // Wait for 5 seconds for more frequent updates
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });

        // Assume metadata.progressPercent exists and is a number 0-100
        const progress = (operation.metadata as any)?.progressPercent || 5;
        let message = 'Preparing video...';
        if (progress > 80) {
            message = 'Finalizing video...';
        } else if (progress > 30) {
            message = 'Encoding video...';
        }
        onProgress(progress, message);
    }

    onProgress(100, 'Finalizing video...');

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation succeeded but no download link was provided.");
    }
    
    onProgress(100, 'Downloading video...');

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};