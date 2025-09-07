

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { isolateLogo, generateMockup, generateVideoMockup, generateLogoVariation } from './services/geminiService';
import type { MockupTask, MockupResult } from './types';
import { UploadIcon, SparklesIcon, LoaderIcon, DownloadIcon, CameraIcon } from './components/icons';
import CameraCapture from './components/CameraCapture';

const STYLES_TO_GENERATE = [
    { name: 'Minimalist', key: 'minimalist' },
    { name: 'Retro', key: 'retro' },
    { name: 'Futuristic', key: 'futuristic' },
    { name: 'Hand-drawn', key: 'hand-drawn' },
    { name: 'Geometric', key: 'geometric' },
];

const App: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const [isolatedLogoPreview, setIsolatedLogoPreview] = useState<string | null>(null);
    const [logoVariations, setLogoVariations] = useState<{ style: string, image: string }[]>([]);
    const [selectedLogoForMockup, setSelectedLogoForMockup] = useState<string | null>(null);

    const [mockups, setMockups] = useState<MockupResult[]>([]);
    
    const [isIsolating, setIsIsolating] = useState<boolean>(false);
    const [isGeneratingMockups, setIsGeneratingMockups] = useState<boolean>(false);

    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

    const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
    
    const [mugBackgroundColor, setMugBackgroundColor] = useState<string>('#f0f0f0');
    const [businessCardBackgroundColor, setBusinessCardBackgroundColor] = useState<string>('#2d3748');
    const [bookCoverColor, setBookCoverColor] = useState<string>('#334155');
    const [tshirtColor, setTshirtColor] = useState<string>('#1f2937');
    const [phoneScreenBackgroundColor, setPhoneScreenBackgroundColor] = useState<string>('#FFFFFF');
    const [laptopColor, setLaptopColor] = useState<string>('#c0c0c0');
    const [notebookCoverColor, setNotebookCoverColor] = useState<string>('#8b4513');
    const [toteBagColor, setToteBagColor] = useState<string>('#f5f5dc');
    const [stickerSheetBackgroundColor, setStickerSheetBackgroundColor] = useState<string>('#e5e7eb');
    const [posterBackgroundColor, setPosterBackgroundColor] = useState<string>('#ffffff');
    const [blurIntensity, setBlurIntensity] = useState<number>(50);
    const [progress, setProgress] = useState<number>(0);


    const MOCKUP_TASKS: MockupTask[] = useMemo(() => [
        { type: 'Book', prompt: 'Place this logo realistically on the cover of a sleek, modern hardcover book with a dark, matte finish. The book should be displayed standing upright on a minimalist light-colored shelf.' },
        { type: 'Mug', prompt: 'Place this logo onto the side of a glossy white ceramic coffee mug. The mug should be sitting on a clean, modern wooden desk next to a laptop.' },
        { type: 'Business Card', prompt: 'Place this logo onto a premium, thick business card with a subtle texture. The card should be shown at a slight angle on a dark, professional background to highlight its quality.' },
        { type: 'T-shirt', prompt: 'Place this logo on the chest of a high-quality, black cotton t-shirt worn by a person in a well-lit, minimalist urban setting. The logo should look naturally integrated with the fabric.' },
        { type: 'Laptop Sticker', prompt: 'Create a mockup of this logo as a vinyl sticker on the back of a modern, silver laptop (like a MacBook). The laptop is open on a desk, with a creative office space in the background.' },
        { type: 'Billboard', prompt: 'Display this logo prominently on a large billboard overlooking a busy city intersection at dusk. The lighting should be dramatic, with the billboard illuminated, making the logo stand out against the evening sky.' },
        { type: 'Phone Screen', prompt: "Showcase this logo as the main feature of a mobile application's splash screen. The phone should be a modern, bezel-less smartphone held by a person in a bright, casual setting like a coffee shop. The logo needs to be centered and clearly visible." },
        { type: 'Notebook Cover', prompt: "Emboss this logo onto the cover of a premium leather-bound A5 notebook. The notebook is lying on a rustic wooden desk, next to a fountain pen and a pair of glasses, suggesting a professional or academic setting. The lighting should be warm and focused." },
        { type: 'Tote Bag', prompt: "Place this logo on a natural canvas tote bag. The bag is being carried by a person walking through a vibrant farmer's market. The logo should appear as a high-quality print, slightly textured to match the fabric of the bag." },
        { type: 'Sticker Sheet', prompt: "Generate a mockup of a die-cut sticker sheet featuring this logo. The sheet should contain multiple copies of the logo in various sizes. The sticker sheet is placed on a clean, light-colored background with a slight peel on one corner to show it's a sticker." },
        { type: 'Poster', prompt: "Design a minimalist A3 poster where this logo is the central element. The poster is framed and hanging on a clean, white brick wall in a modern art gallery or studio space. The lighting should be soft and even, highlighting the poster's design." }
    ], []);

     const VIDEO_MOCKUP_TASKS: MockupTask[] = useMemo(() => [
        { type: 'Mug', prompt: `A short, cinematic 5-second video showcasing this logo on a glossy white ceramic coffee mug. The mug should be sitting on a clean, modern surface with a solid background color of ${mugBackgroundColor}. The camera should slowly orbit around the mug, highlighting the logo. The video should be a seamless loop.` },
        { type: 'Business Card', prompt: `A professional 5-second video mockup of this logo on a premium, thick business card. The card should be shown falling slowly onto a solid, professional background with the color ${businessCardBackgroundColor}, landing gently. The video should be a seamless loop.` },
        { type: 'T-shirt', prompt: 'A short, cinematic 5-second video of a person wearing a high-quality t-shirt with this logo on the chest. They are walking through a stylish, modern urban environment. The camera slowly zooms in on the logo. Seamless loop.' },
        { type: 'Laptop Sticker', prompt: 'A professional 5-second video showing this logo as a sticker on a modern laptop. The camera smoothly pans across the laptop, which is sitting on a desk in a creative office setting. Seamless loop.' },
        { type: 'Billboard', prompt: 'A dramatic 5-second time-lapse video of a busy city intersection at dusk, featuring this logo prominently on an illuminated billboard. The city lights create a dynamic background. Seamless loop.' },
    ], [mugBackgroundColor, businessCardBackgroundColor]);

    const availableImageMockups = useMemo(() => MOCKUP_TASKS.map(t => t.type), [MOCKUP_TASKS]);
    const availableVideoMockups = useMemo(() => VIDEO_MOCKUP_TASKS.map(t => t.type), [VIDEO_MOCKUP_TASKS]);

    const [selectedMockups, setSelectedMockups] = useState<string[]>(availableImageMockups);

    useEffect(() => {
        if (generationType === 'image') {
            setSelectedMockups(availableImageMockups);
        } else {
            setSelectedMockups(availableVideoMockups);
        }
    }, [generationType, availableImageMockups, availableVideoMockups]);

    const handleMockupSelection = (type: string) => {
        setSelectedMockups(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleSelectAll = () => {
        const allTypes = (generationType === 'image' ? MOCKUP_TASKS : VIDEO_MOCKUP_TASKS).map(t => t.type);
        setSelectedMockups(allTypes);
    };

    const handleDeselectAll = () => {
        setSelectedMockups([]);
    };

    const handleFileSelect = (file: File) => {
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        setError(null);
        setMockups([]);
        setIsolatedLogoPreview(null);
        setLogoVariations([]);
        setSelectedLogoForMockup(null);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };
    
    const handleCaptureComplete = (file: File) => {
        handleFileSelect(file);
        setIsCameraOpen(false);
    };

    const getBlurLabel = (intensity: number): string => {
        if (intensity === 0) return 'None';
        if (intensity <= 33) return 'Low';
        if (intensity <= 66) return 'Medium';
        return 'High';
    };

    const getBlurPromptFragment = (intensity: number): string => {
        if (intensity === 0) {
            return ' The background should be in sharp focus with no blur.';
        } else if (intensity <= 33) {
            return ' The background should have a subtle, light blur (low depth of field).';
        } else if (intensity <= 66) {
            return ' The background should have a medium, noticeable blur (medium depth of field).';
        } else {
            return ' The background should be heavily blurred, creating a strong bokeh effect (shallow depth of field).';
        }
    };

    const handleIsolateAndStylize = useCallback(async () => {
        if (!selectedImage) {
            setError('Please upload an image first.');
            return;
        }

        setIsIsolating(true);
        setLoadingMessage('Isolating logo...');
        setError(null);
        setMockups([]);
        setLogoVariations([]);
        setIsolatedLogoPreview(null);
        setSelectedLogoForMockup(null);

        try {
            const isolatedLogoData = await isolateLogo(selectedImage);
            const isolatedLogoUrl = `data:image/png;base64,${isolatedLogoData}`;
            setIsolatedLogoPreview(isolatedLogoUrl);
            setSelectedLogoForMockup(isolatedLogoUrl); // Default to original

            setLoadingMessage('Generating style variations...');

            const variationPromises = STYLES_TO_GENERATE.map(style => 
                generateLogoVariation(isolatedLogoData, style.key)
            );
            
            const results = await Promise.allSettled(variationPromises);

            const successfulVariations = results
                .map((result, index) => {
                    if (result.status === 'fulfilled') {
                        return { style: STYLES_TO_GENERATE[index].name, image: result.value };
                    }
                    console.error(`Failed to generate ${STYLES_TO_GENERATE[index].name} variation:`, result.reason);
                    return null;
                })
                .filter((v): v is { style: string; image: string; } => v !== null);

            setLogoVariations(successfulVariations);

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? `Failed to process logo: ${e.message}` : 'An unknown error occurred.');
        } finally {
            setIsIsolating(false);
            setLoadingMessage('');
        }
    }, [selectedImage]);

    const handleGenerateMockups = useCallback(async () => {
        if (!selectedLogoForMockup) {
            setError('Please select a logo style to generate mockups.');
            return;
        }
        if (selectedMockups.length === 0) {
            setError('Please select at least one mockup to generate.');
            return;
        }
        
        const isolatedLogoData = selectedLogoForMockup.split(',')[1];

        setIsGeneratingMockups(true);
        setError(null);
        setMockups([]);
        setProgress(0);

        try {
            if (generationType === 'image') {
                const tasksToRun = MOCKUP_TASKS.filter(task => selectedMockups.includes(task.type));
                const generatedImages: MockupResult[] = [];
                for (const [index, task] of tasksToRun.entries()) {
                    setLoadingMessage(`Generating ${task.type} mockup...`);
                    
                    let finalPrompt = task.prompt;

                    if (task.type === 'Mug') {
                        finalPrompt = `Place this logo onto the side of a glossy white ceramic coffee mug. The mug should be sitting on a clean, modern surface, set against a solid background with the color ${mugBackgroundColor}.`;
                    } else if (task.type === 'Business Card') {
                        finalPrompt = `Place this logo onto a premium, thick business card with a subtle texture. The card should be shown at a slight angle on a solid, professional background with the color ${businessCardBackgroundColor} to highlight its quality.`;
                    } else if (task.type === 'Book') {
                        finalPrompt = `Place this logo realistically on the cover of a sleek, modern hardcover book with a matte finish and the color ${bookCoverColor}. The book should be displayed standing upright on a minimalist light-colored shelf.${getBlurPromptFragment(blurIntensity)}`;
                    } else if (task.type === 'T-shirt') {
                        finalPrompt = `Place this logo on the chest of a high-quality, cotton t-shirt with the color ${tshirtColor}, worn by a person in a well-lit, minimalist urban setting. The logo should look naturally integrated with the fabric.${getBlurPromptFragment(blurIntensity)}`;
                    } else if (task.type === 'Phone Screen') {
                        finalPrompt = `Showcase this logo as the main feature of a mobile application's splash screen with a solid background color of ${phoneScreenBackgroundColor}. The phone should be a modern, bezel-less smartphone held by a person in a bright, casual setting like a coffee shop. The logo needs to be centered and clearly visible.${getBlurPromptFragment(blurIntensity)}`;
                    } else if (task.type === 'Laptop Sticker') {
                        finalPrompt = `Create a mockup of this logo as a vinyl sticker on the back of a modern, ${laptopColor} laptop. The laptop is open on a desk, with a creative office space in the background.${getBlurPromptFragment(blurIntensity)}`;
                    } else if (task.type === 'Notebook Cover') {
                        finalPrompt = `Emboss this logo onto the cover of a premium, ${notebookCoverColor} color leather-bound A5 notebook. The notebook is lying on a rustic wooden desk, next to a fountain pen and a pair of glasses, suggesting a professional or academic setting. The lighting should be warm and focused.${getBlurPromptFragment(blurIntensity)}`;
                    } else if (task.type === 'Tote Bag') {
                        finalPrompt = `Place this logo on a ${toteBagColor} color canvas tote bag. The bag is being carried by a person walking through a vibrant farmer's market. The logo should appear as a high-quality print, slightly textured to match the fabric of the bag.${getBlurPromptFragment(blurIntensity)}`;
                    } else if (task.type === 'Sticker Sheet') {
                        finalPrompt = `Generate a mockup of a die-cut sticker sheet featuring this logo. The sheet should contain multiple copies of the logo in various sizes. The sticker sheet is placed on a clean, ${stickerSheetBackgroundColor} color background with a slight peel on one corner to show it's a sticker.${getBlurPromptFragment(blurIntensity)}`;
                    } else if (task.type === 'Poster') {
                        finalPrompt = `Design a minimalist A3 poster with a background color of ${posterBackgroundColor} where this logo is the central element. The poster is framed and hanging on a clean, white brick wall in a modern art gallery or studio space. The lighting should be soft and even, highlighting the poster's design.${getBlurPromptFragment(blurIntensity)}`;
                    } else {
                         finalPrompt = `${task.prompt}${getBlurPromptFragment(blurIntensity)}`;
                    }

                    const mockupImage = await generateMockup(isolatedLogoData, finalPrompt);
                    const result: MockupResult = { id: Date.now() + index, type: 'image', src: `data:image/png;base64,${mockupImage}`, taskType: task.type };
                    setMockups(prev => [...prev, result]);
                }
            } else { // Video generation
                const generatedVideos: MockupResult[] = [];
                const handleProgressUpdate = (progressValue: number, message: string) => {
                    setProgress(progressValue);
                    setLoadingMessage(message);
                };

                const tasksToRun = VIDEO_MOCKUP_TASKS.filter(task => selectedMockups.includes(task.type));

                for (const [index, task] of tasksToRun.entries()) {
                    setLoadingMessage(`Queuing ${task.type} video generation...`);
                    const videoUrl = await generateVideoMockup(isolatedLogoData, task.prompt, handleProgressUpdate);
                    const result: MockupResult = { id: Date.now() + index, type: 'video', src: videoUrl, taskType: task.type };
                    setMockups(prev => [...prev, result]);
                }
            }
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? `Failed to generate mockups: ${e.message}` : 'An unknown error occurred.');
        } finally {
            setIsGeneratingMockups(false);
            setLoadingMessage('');
            setProgress(0);
        }
    }, [selectedLogoForMockup, selectedMockups, MOCKUP_TASKS, VIDEO_MOCKUP_TASKS, mugBackgroundColor, businessCardBackgroundColor, bookCoverColor, tshirtColor, phoneScreenBackgroundColor, laptopColor, notebookCoverColor, toteBagColor, stickerSheetBackgroundColor, posterBackgroundColor, blurIntensity, generationType]);


    const handleDownload = (mockup: MockupResult) => {
        const link = document.createElement('a');
        link.href = mockup.src;
        const fileExtension = mockup.type === 'video' ? 'mp4' : 'png';
        link.download = `Logo-${mockup.taskType}-Mockup.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-8">
            <div className="container mx-auto max-w-6xl">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 pb-2">
                        AI Logo Mockup Generator
                    </h1>
                    <p className="text-lg text-gray-400">Upload, stylize, and generate mockups for your logo.</p>
                </header>

                <main>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
                            <div className="w-full flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold text-blue-300">1. Upload Your Logo</h2>
                                <button 
                                    onClick={() => setIsCameraOpen(true)}
                                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Use camera to capture logo"
                                >
                                    <CameraIcon className="w-5 h-5" />
                                    Use Camera
                                </button>
                            </div>
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
                                onClick={handleIsolateAndStylize}
                                disabled={!selectedImage || isIsolating}
                                className="mt-6 w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 shadow-lg"
                            >
                                {isIsolating ? (
                                    <>
                                        <LoaderIcon className="w-6 h-6 animate-spin"/>
                                        <span>{loadingMessage || 'Processing...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-6 h-6"/>
                                        <span>Isolate & Stylize Logo</span>
                                    </>
                                )}
                            </button>

                            {isolatedLogoPreview && (
                                <div className="mt-6 pt-6 border-t border-gray-700">
                                    <h2 className="text-2xl font-semibold text-blue-300 mb-4">2. Select a Logo Style</h2>
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-pressed={selectedLogoForMockup === isolatedLogoPreview}
                                            className={`p-2 rounded-lg cursor-pointer transition-all border-2 ${selectedLogoForMockup === isolatedLogoPreview ? 'border-blue-500 bg-blue-900/50' : 'border-transparent bg-gray-700 hover:bg-gray-600'}`}
                                            onClick={() => setSelectedLogoForMockup(isolatedLogoPreview)}
                                            onKeyDown={(e) => e.key === 'Enter' && setSelectedLogoForMockup(isolatedLogoPreview)}
                                        >
                                            <img src={isolatedLogoPreview} alt="Original Isolated Logo" className="h-20 w-20 object-contain"/>
                                            <p className="text-xs text-center mt-1 font-medium">Original</p>
                                        </div>
                                        {logoVariations.map((variation, index) => (
                                            <div
                                                key={index}
                                                role="button"
                                                tabIndex={0}
                                                aria-pressed={selectedLogoForMockup === `data:image/png;base64,${variation.image}`}
                                                className={`p-2 rounded-lg cursor-pointer transition-all border-2 ${selectedLogoForMockup === `data:image/png;base64,${variation.image}` ? 'border-blue-500 bg-blue-900/50' : 'border-transparent bg-gray-700 hover:bg-gray-600'}`}
                                                onClick={() => setSelectedLogoForMockup(`data:image/png;base64,${variation.image}`)}
                                                onKeyDown={(e) => e.key === 'Enter' && setSelectedLogoForMockup(`data:image/png;base64,${variation.image}`)}
                                            >
                                                <img src={`data:image/png;base64,${variation.image}`} alt={`Logo variation ${variation.style}`} className="h-20 w-20 object-contain"/>
                                                <p className="text-xs text-center mt-1">{variation.style}</p>
                                            </div>
                                        ))}
                                        {isIsolating && !logoVariations.length && STYLES_TO_GENERATE.map(s => (
                                            <div key={s.key} className="h-[100px] w-[100px] bg-gray-700 rounded-lg flex flex-col items-center justify-center p-2">
                                                <LoaderIcon className="w-8 h-8"/>
                                                <p className="text-xs text-center mt-1">{s.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isolatedLogoPreview && (
                                <>
                                    <div className="w-full mt-6 pt-6 border-t border-gray-700 space-y-4">
                                        <h2 className="text-2xl font-semibold text-blue-300">3. Customize Mockups</h2>
                                        <div className="flex items-center justify-between">
                                            <label className="text-gray-400">Generation Mode</label>
                                            <div className="flex rounded-lg bg-gray-700 p-1">
                                                <button onClick={() => setGenerationType('image')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${generationType === 'image' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Image</button>
                                                <button onClick={() => setGenerationType('video')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${generationType === 'video' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Video</button>
                                            </div>
                                        </div>
                                        {/* Customization options */}
                                        {generationType === 'image' ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="mug-color" className="text-gray-400">Mug Background</label>
                                            <input id="mug-color" type="color" value={mugBackgroundColor} onChange={(e) => setMugBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Mug Background Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="card-color" className="text-gray-400">Card Background</label>
                                            <input id="card-color" type="color" value={businessCardBackgroundColor} onChange={(e) => setBusinessCardBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Business Card Background Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="book-color" className="text-gray-400">Book Cover</label>
                                            <input id="book-color" type="color" value={bookCoverColor} onChange={(e) => setBookCoverColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Book Cover Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="tshirt-color" className="text-gray-400">T-shirt Color</label>
                                            <input id="tshirt-color" type="color" value={tshirtColor} onChange={(e) => setTshirtColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select T-shirt Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="phone-color" className="text-gray-400">Phone Screen BG</label>
                                            <input id="phone-color" type="color" value={phoneScreenBackgroundColor} onChange={(e) => setPhoneScreenBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Phone Screen Background Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="laptop-color" className="text-gray-400">Laptop Color</label>
                                            <input id="laptop-color" type="color" value={laptopColor} onChange={(e) => setLaptopColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Laptop Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="notebook-color" className="text-gray-400">Notebook Cover</label>
                                            <input id="notebook-color" type="color" value={notebookCoverColor} onChange={(e) => setNotebookCoverColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Notebook Cover Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="tote-bag-color" className="text-gray-400">Tote Bag Color</label>
                                            <input id="tote-bag-color" type="color" value={toteBagColor} onChange={(e) => setToteBagColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Tote Bag Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="sticker-sheet-bg-color" className="text-gray-400">Sticker Sheet BG</label>
                                            <input id="sticker-sheet-bg-color" type="color" value={stickerSheetBackgroundColor} onChange={(e) => setStickerSheetBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Sticker Sheet Background Color" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="poster-bg-color" className="text-gray-400">Poster BG</label>
                                            <input id="poster-bg-color" type="color" value={posterBackgroundColor} onChange={(e) => setPosterBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Poster Background Color" />
                                        </div>
                                        <div className="pt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label htmlFor="blur-intensity" className="text-gray-400">Background Blur</label>
                                                <span className="text-sm font-medium text-blue-300 px-2 py-0.5 rounded-full bg-gray-700">{getBlurLabel(blurIntensity)}</span>
                                            </div>
                                            <input id="blur-intensity" type="range" min="0" max="100" value={blurIntensity} onChange={(e) => setBlurIntensity(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500" title="Adjust background blur intensity" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="mug-color-video" className="text-gray-400">Mug BG (Video)</label>
                                            <input id="mug-color-video" type="color" value={mugBackgroundColor} onChange={(e) => setMugBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Mug Background Color for Video" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="card-color-video" className="text-gray-400">Card BG (Video)</label>
                                            <input id="card-color-video" type="color" value={businessCardBackgroundColor} onChange={(e) => setBusinessCardBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" title="Select Card Background Color for Video" />
                                        </div>
                                        <p className="text-xs text-gray-500 text-center pt-2">Advanced settings are not applicable for video mockups.</p>
                                    </>
                                )}
                                    </div>

                                    <div className="w-full mt-6 pt-6 border-t border-gray-700 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-2xl font-semibold text-blue-300">4. Select Mockups</h2>
                                            <div className="flex gap-2">
                                                <button onClick={handleSelectAll} className="text-xs text-blue-400 hover:underline">Select All</button>
                                                <button onClick={handleDeselectAll} className="text-xs text-gray-500 hover:underline">Deselect All</button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(generationType === 'image' ? MOCKUP_TASKS : VIDEO_MOCKUP_TASKS).map(task => (
                                                <button
                                                    key={task.type}
                                                    onClick={() => handleMockupSelection(task.type)}
                                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-200 ${
                                                        selectedMockups.includes(task.type)
                                                            ? 'bg-blue-600 text-white font-semibold shadow-md'
                                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    }`}
                                                    aria-pressed={selectedMockups.includes(task.type)}
                                                >
                                                    {task.type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>


                                    <button
                                        onClick={handleGenerateMockups}
                                        disabled={isGeneratingMockups || selectedMockups.length === 0}
                                        className="mt-8 w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg"
                                        title={selectedMockups.length === 0 ? "Please select at least one mockup type" : "Generate selected mockups"}
                                    >
                                        {isGeneratingMockups ? (
                                            <>
                                                <LoaderIcon className="w-6 h-6 animate-spin"/>
                                                <span>Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-6 h-6"/>
                                                <span>Generate {selectedMockups.length} Mockup{selectedMockups.length !== 1 && 's'}</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-md w-full text-center">{error}</p>}
                        </div>

                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-300">Results</h2>
                            {(isGeneratingMockups) && (
                                <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                                    <LoaderIcon className="w-16 h-16"/>
                                    <p className="mt-4 text-lg text-gray-300 animate-pulse">{loadingMessage}</p>
                                    {generationType === 'video' && progress > 0 && (
                                         <div className="w-full max-w-sm bg-gray-700 rounded-full h-2.5 mt-4 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Video generation progress">
                                            <div 
                                                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-linear" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isGeneratingMockups && mockups.length === 0 && (
                                <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500 text-center">
                                    <p>Your generated mockups will appear here.</p>
                                </div>
                            )}
                            
                            <div className="space-y-6">
                                {mockups.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {mockups.map((mockup) => (
                                            <div key={mockup.id} className="relative group overflow-hidden rounded-lg border border-gray-700 aspect-square">
                                                {mockup.type === 'image' ? (
                                                    <img src={mockup.src} alt={`Mockup for ${mockup.taskType}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                ) : (
                                                    <video src={mockup.src} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <p className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                                                  {mockup.taskType} {mockup.type === 'video' ? 'Video' : 'Mockup'}
                                                </p>
                                                <button
                                                    onClick={() => handleDownload(mockup)}
                                                    className="absolute top-2 right-2 bg-blue-600/80 text-white p-2 rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100"
                                                    aria-label={`Download ${mockup.taskType} mockup`}
                                                >
                                                    <DownloadIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
                {isCameraOpen && (
                    <CameraCapture 
                        onCapture={handleCaptureComplete}
                        onClose={() => setIsCameraOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default App;