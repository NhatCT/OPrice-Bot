import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { GuidedInputForm } from './GuidedInputForm';
import type { Task } from './GuidedInputForm';
import type { ChatMessage } from '../types';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { StopIcon } from './icons/StopIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { TagIcon } from './icons/TagIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { CameraIcon } from './icons/CameraIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ReceiptPercentIcon } from './icons/ReceiptPercentIcon';


// TypeScript declarations for the SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: (event: Event) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    start: () => void;
    stop: () => void;
  }

  var SpeechRecognition: {
    new (): SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    new (): SpeechRecognition;
  };

  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }
}

type ImageData = ChatMessage['image'];

interface MessageInputProps {
  onSendMessage: (message: string, image?: ImageData) => void;
  isLoading: boolean;
  onNewChat: () => void;
  onClearChat: () => void;
  activeTool: Task | null;
  setActiveTool: (tool: Task | null) => void;
  onStopGeneration: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  onNewChat, 
  onClearChat, 
  activeTool, 
  setActiveTool,
  onStopGeneration,
}) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<ImageData | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextOnRecordStart = useRef('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'vi-VN';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;

        if (lastResult.isFinal) {
          setInput(prev => (baseTextOnRecordStart.current + ' ' + transcript).trim());
        } else {
          setInput((baseTextOnRecordStart.current + ' ' + transcript).trim() + '…');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInput(prev => prev.endsWith('…') ? prev.slice(0, -1) : prev);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Quyền truy cập micro đã bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt.');
        }
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, []);

  const handleToggleRecording = () => {
    if (!recognitionRef.current || isLoading) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      baseTextOnRecordStart.current = input;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Could not start speech recognition:", error);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          alert('Kích thước ảnh không được vượt quá 4MB.');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({
          data: reader.result as string,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || image) && !isLoading) {
      onSendMessage(input.trim(), image ?? undefined);
      setInput('');
      handleRemoveImage();
    }
  };
  
  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCamera = async () => {
    if (isLoading) return;
    setCapturedImage(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        setIsCameraOpen(true);
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập trong cài đặt trình duyệt của bạn.');
    }
  };

  const handleCloseCamera = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }
      streamRef.current = null;
      setIsCameraOpen(false);
      setCapturedImage(null);
  };

  const handleTakePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (context) {
              context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              setCapturedImage(dataUrl);
          }
      }
  };
  
  const handleRetakePhoto = () => {
      setCapturedImage(null);
  };

  const handleUsePhoto = () => {
      if (capturedImage) {
          setImage({
              data: capturedImage,
              mimeType: 'image/jpeg',
          });
      }
      handleCloseCamera();
  };
  
  const quickActionClass = "flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700/50 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 rounded-lg px-3 py-1.5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  if (activeTool) {
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <GuidedInputForm 
                task={activeTool}
                onSubmit={onSendMessage}
                onCancel={() => setActiveTool(null)}
                isLoading={isLoading}
            />
        </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
             <button onClick={() => setActiveTool('profit-analysis')} className={quickActionClass} disabled={isLoading}>
                <ChartBarIcon className="w-4 h-4 text-sky-500" />
                <span>Phân tích Lợi nhuận</span>
            </button>
            <button onClick={() => setActiveTool('promo-price')} className={quickActionClass} disabled={isLoading}>
                <TagIcon className="w-4 h-4 text-green-500" />
                <span>Phân tích Khuyến mãi</span>
            </button>
             <button onClick={() => setActiveTool('group-price')} className={quickActionClass} disabled={isLoading}>
                <CollectionIcon className="w-4 h-4 text-purple-500" />
                <span>Phân tích Đồng giá</span>
            </button>
             <button onClick={() => handleQuickAction("Tạo mã giảm giá 15% cho 'Áo Thun V64' mã HEV64")} className={quickActionClass} disabled={isLoading}>
                <ReceiptPercentIcon className="w-4 h-4 text-orange-500" />
                <span>Tạo mã giảm giá</span>
            </button>
        </div>

        {image && (
            <div className="relative self-start mb-3 ml-20">
                <div className="bg-slate-200 dark:bg-slate-700 p-1 rounded-lg border border-slate-300 dark:border-slate-600 inline-block">
                    <img src={image.data} alt="Preview" className="max-h-24 max-w-xs rounded" />
                </div>
                <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-slate-800 dark:bg-slate-600 text-white rounded-full p-0.5 hover:bg-slate-700 dark:hover:bg-slate-500 transition-colors shadow-md"
                    aria-label="Remove image"
                    title="Gỡ ảnh"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setIsMenuOpen(p => !p)} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50">
                    <DotsVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute bottom-full mb-2 w-48 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 z-10 animate-fade-in-up">
                         <button onClick={() => { onNewChat(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">
                            <PlusIcon className="w-4 h-4" />
                            <span>Trò chuyện mới</span>
                         </button>
                         <button onClick={() => { onClearChat(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-200">
                            <TrashIcon className="w-4 h-4" />
                            <span>Xóa tin nhắn</span>
                         </button>
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            <div className="flex items-center -ml-2">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50"
                    aria-label="Attach an image"
                    title="Đính kèm ảnh"
                >
                    <UploadIcon className="w-5 h-5" />
                </button>
                 <button
                    type="button"
                    onClick={handleOpenCamera}
                    disabled={isLoading}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50"
                    aria-label="Take a photo"
                    title="Chụp ảnh"
                >
                    <CameraIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="relative flex-1">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập yêu cầu hoặc dùng micro để nói..."
                    disabled={isLoading}
                    className="flex-1 w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-300 border border-slate-200 dark:border-transparent pr-12"
                    autoComplete="off"
                />
                 {isSpeechSupported && (
                    <button
                        type="button"
                        onClick={handleToggleRecording}
                        disabled={isLoading}
                        className={`absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-slate-500 dark:text-slate-400 transition-colors duration-200 rounded-r-full ${isRecording ? 'text-red-500 animate-pulse-mic' : 'hover:text-sky-500 dark:hover:text-sky-400'}`}
                        aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                        title={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            {isLoading ? (
                 <button
                    type="button"
                    onClick={onStopGeneration}
                    className="bg-red-600 text-white rounded-full p-3 hover:bg-red-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 flex items-center gap-2"
                    aria-label="Stop generation"
                    title="Dừng"
                    >
                    <StopIcon className="w-6 h-6" />
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={(!input.trim() && !image) || isLoading}
                    className="bg-sky-600 text-white rounded-full p-3 hover:bg-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800"
                    aria-label="Send message"
                >
                    <PaperAirplaneIcon className="w-6 h-6" />
                </button>
            )}
        </form>

        {isCameraOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in-fast" onClick={handleCloseCamera}>
                <div className="relative bg-slate-900 rounded-lg shadow-2xl w-full max-w-2xl aspect-video overflow-hidden" onClick={e => e.stopPropagation()}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover transition-opacity duration-300 ${capturedImage ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {capturedImage && (
                        <img src={capturedImage} alt="Captured preview" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                    <button
                        onClick={handleCloseCamera}
                        className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                        aria-label="Close camera"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-6 flex items-center space-x-6">
                    {!capturedImage ? (
                        <button onClick={handleTakePhoto} className="p-4 bg-white rounded-full shadow-lg hover:scale-105 transition-transform" aria-label="Take photo" title="Chụp ảnh">
                            <div className="w-8 h-8 rounded-full border-4 border-slate-700 bg-white"></div>
                        </button>
                    ) : (
                        <>
                            <button onClick={handleRetakePhoto} className="flex items-center gap-2 px-6 py-3 bg-white/90 text-slate-800 rounded-full font-semibold hover:bg-white transition-colors shadow-lg" aria-label="Retake photo">
                                <ArrowUturnLeftIcon className="w-5 h-5" />
                                <span>Chụp lại</span>
                            </button>
                            <button onClick={handleUsePhoto} className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-full font-semibold hover:bg-sky-500 transition-colors shadow-lg" aria-label="Use photo">
                                <CheckIcon className="w-5 h-5" />
                                <span>Dùng ảnh này</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};


const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-fade-in-up {
        animation: fadeInUp 0.15s ease-out forwards;
        transform-origin: bottom left;
    }
    @keyframes pulse-mic {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
    }
    .animate-pulse-mic {
        animation: pulse-mic 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes fadeInFast {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .animate-fade-in-fast {
        animation: fadeInFast 0.2s ease-out forwards;
    }
`;
document.head.appendChild(style);
