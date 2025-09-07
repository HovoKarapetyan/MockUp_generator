
import React, { useState, useCallback, useMemo } from 'react';
import { isolateLogo, generateMockup } from './services/geminiService';
import type { MockupTask } from './types';
import { UploadIcon, SparklesIcon, LoaderIcon } from './components/icons';

const App: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isolatedLogoPreview, setIsolatedLogoPreview] = useState<string | null>(null);
    const [mockups, setMockups] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const MOCKUP_TASKS: MockupTask[] = useMemo(() => [
        { type: 'Book', prompt: 'Place this logo realistically on the cover of a sleek, modern hardcover book with a dark, matte finish. The book should be displayed standing upright on a minimalist light-colored shelf.' },
        { type: 'Mug', prompt: 'Place this logo onto the side of a glossy white ceramic coffee mug. The mug should be sitting on a clean, modern wooden desk next to a laptop.' },
        { type: 'Business Card', prompt: 'Place this logo onto a premium, thick business card with a subtle texture. The card should be shown at a slight angle on a dark, professional background to highlight its quality.' }
    ], []);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError(null);
            setMockups([]);
            setIsolatedLogoPreview(null);
        }
    };

    const handleGenerateMockups = useCallback(async () => {
        if (!selectedImage) {
            setError('Please upload an image first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setMockups([]);
        setIsolatedLogoPreview(null);

        try {
            setLoadingMessage('Isolating TechPro logo...');
            const isolatedLogoData = await isolateLogo(selectedImage);
            setIsolatedLogoPreview(`data:image/png;base64,${isolatedLogoData}`);

            const generatedImages: string[] = [];
            for (const task of MOCKUP_TASKS) {
                setLoadingMessage(`Generating ${task.type} mockup...`);
                const mockupImage = await generateMockup(isolatedLogoData, task.prompt);
                generatedImages.push(`data:image/png;base64,${mockupImage}`);
                setMockups([...generatedImages]);
            }
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? `Failed to generate mockups: ${e.message}` : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [selectedImage, MOCKUP_TASKS]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-8">
            <div className="container mx-auto max-w-6xl">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 pb-2">
                        AI Logo Mockup Generator
                    </h1>
                    <p className="text-lg text-gray-400">Upload an image with your logo and watch the magic happen.</p>
                </header>

                <main>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col items-center">
                            <h2 className="text-2xl font-semibold mb-4 self-start text-blue-300">1. Upload Your Logo</h2>
                            <label htmlFor="file-upload" className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-all duration-300">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Selected logo" className="max-h-full max-w-full object-contain rounded-md p-2"/>
                                ) : (
                                    <div className="text-center">
                                        <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                                        <p className="mt-2 text-gray-400">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                                    </div>
                                )}
                            </label>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                            
                            <button
                                onClick={handleGenerateMockups}
                                disabled={!selectedImage || isLoading}
                                className="mt-6 w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg"
                            >
                                {isLoading ? (
                                    <>
                                        <LoaderIcon className="w-6 h-6 animate-spin"/>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-6 h-6"/>
                                        <span>Generate Mockups</span>
                                    </>
                                )}
                            </button>
                            {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-md w-full text-center">{error}</p>}
                        </div>

                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-300">2. View Results</h2>
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                                    <LoaderIcon className="w-16 h-16"/>
                                    <p className="mt-4 text-lg text-gray-300 animate-pulse">{loadingMessage}</p>
                                </div>
                            )}

                            {!isLoading && mockups.length === 0 && (
                                <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500 text-center">
                                    <p>Your generated mockups will appear here.</p>
                                </div>
                            )}
                            
                            <div className="space-y-6">
                                {isolatedLogoPreview && (
                                    <div className="text-center">
                                        <h3 className="text-lg font-medium text-gray-400 mb-2">Isolated Logo</h3>
                                        <div className="bg-gray-700/50 p-4 rounded-lg inline-block">
                                             <img src={isolatedLogoPreview} alt="Isolated TechPro Logo" className="h-20 object-contain"/>
                                        </div>
                                    </div>
                                )}
                                {mockups.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                        {mockups.map((mockupSrc, index) => (
                                            <div key={index} className="relative group overflow-hidden rounded-lg border border-gray-700 aspect-square">
                                                <img src={mockupSrc} alt={`Mockup ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/20"></div>
                                                <p className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                                                  {MOCKUP_TASKS[index].type} Mockup
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
