import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LoaderIcon, CloseIcon, RotateLeftIcon, RotateRightIcon, CheckIcon, ArrowUturnLeftIcon, DownloadIcon } from './icons';

// Let TypeScript know that 'Cropper' is available on the global scope
declare var Cropper: any;

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const cropperRef = useRef<any>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const startCamera = useCallback(async () => {
        setError(null);
        setCapturedImage(null);
        if (stream) {
            stopCamera();
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera: ", err);
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (fallbackErr) {
                console.error("Fallback camera access failed: ", fallbackErr);
                setError("Could not access the camera. Please check permissions.");
            }
        }
    }, [stream, stopCamera]);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    useEffect(() => {
        if (capturedImage && imageRef.current) {
            const cropper = new Cropper(imageRef.current, {
                aspectRatio: 0,
                viewMode: 1,
                dragMode: 'move',
                background: false,
                autoCropArea: 0.8,
                movable: true,
                zoomable: true,
                rotatable: true,
                scalable: true,
            });
            cropperRef.current = cropper;
        }
        return () => {
            if (cropperRef.current) {
                cropperRef.current.destroy();
                cropperRef.current = null;
            }
        };
    }, [capturedImage]);

    const handleCapture = useCallback(() => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL('image/png');
                setCapturedImage(imageUrl);
                stopCamera();
            }
        }
    }, [stopCamera]);

    const handleConfirm = () => {
        if (cropperRef.current) {
            cropperRef.current.getCroppedCanvas({
                width: 512,
                height: 512,
                imageSmoothingQuality: 'high',
            }).toBlob((blob: Blob | null) => {
                if (blob) {
                    const file = new File([blob], 'edited-logo.png', { type: 'image/png' });
                    onCapture(file);
                }
            }, 'image/png');
        }
    };
    
    const handleRotate = (degrees: number) => {
      cropperRef.current?.rotate(degrees);
    }
    
    const handleSaveEditedLogo = () => {
        if (cropperRef.current) {
            cropperRef.current.getCroppedCanvas({
                imageSmoothingQuality: 'high',
            }).toBlob((blob: Blob | null) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'edited-logo.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            }, 'image/png');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-full max-w-2xl relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                    aria-label="Close"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold mb-4 text-center">
                  {capturedImage ? 'Edit Logo' : 'Capture Logo'}
                </h2>
                {error && (
                    <div className="text-red-400 bg-red-900/50 p-4 rounded-md text-center">
                        <p>{error}</p>
                    </div>
                )}
                
                {!error && (
                    <div className="flex flex-col items-center gap-4">
                        {!capturedImage ? (
                             !stream ? (
                                <div className="flex flex-col items-center justify-center h-64">
                                     <LoaderIcon className="w-12 h-12" />
                                     <p className="mt-4 text-gray-400">Starting camera...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-600">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain"></video>
                                    </div>
                                    <button 
                                        onClick={handleCapture} 
                                        className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
                                    >
                                        Capture Photo
                                    </button>
                                </>
                            )
                        ) : (
                            <>
                                <div className="w-full h-[40vh] sm:h-[50vh] bg-gray-900 rounded-lg overflow-hidden">
                                    <img ref={imageRef} src={capturedImage} alt="Captured preview" className="max-w-full" style={{ display: 'block' }} />
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2">
                                     <button onClick={() => handleRotate(-90)} title="Rotate Left" className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"><RotateLeftIcon className="w-5 h-5" /></button>
                                     <button onClick={() => handleRotate(90)} title="Rotate Right" className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"><RotateRightIcon className="w-5 h-5" /></button>
                                     <button onClick={handleSaveEditedLogo} title="Save Edited Logo" className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"><DownloadIcon className="w-5 h-5" /></button>
                                     <button onClick={startCamera} title="Retake" className="p-3 bg-gray-700 text-yellow-400 rounded-full hover:bg-gray-600 transition-colors"><ArrowUturnLeftIcon className="w-5 h-5" /></button>
                                     <button onClick={handleConfirm} title="Confirm" className="p-3 bg-green-600 text-white rounded-full hover:bg-green-500 transition-colors"><CheckIcon className="w-5 h-5" /></button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;