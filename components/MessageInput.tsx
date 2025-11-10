

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { GuidedInputForm } from './GuidedInputForm';
import type { Task, BusinessProfile } from '../types';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { StopIcon } from './icons/StopIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { TagIcon } from './icons/TagIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { MapIcon } from './icons/MapIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';


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

interface ActiveTool {
    task: Task;
    initialData?: Record<string, any>;
}

interface MessageInputProps {
  onSendMessage: (message: string, image?: { file: File; dataUrl: string }) => void;
  onSendAnalysis: (task: Task, params: Record<string, any>) => void;
  isLoading: boolean;
  onNewChat: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
  onStopGeneration: () => void;
  businessProfile: BusinessProfile | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage,
  onSendAnalysis,
  isLoading, 
  onNewChat, 
  onClearChat, 
  onExportChat,
  activeTool, 
  setActiveTool,
  onStopGeneration,
  businessProfile,
}) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ file: File; dataUrl: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextOnRecordStart = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Handle specific, expected events first.
        if (event.error === 'no-speech') {
          // This is a common event when the user clicks the mic but doesn't speak.
          // Log it for debugging but avoid treating it as a critical error.
          console.log('Speech recognition ended: No speech was detected.');
        } else if (event.error === 'not-allowed') {
          console.error('Speech recognition error: Permission denied.');
          alert('Quyền truy cập micro đã bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt của bạn.');
        } else {
          // Log any other unexpected errors.
          console.error('Speech recognition error:', event.error);
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage({ file, dataUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || image) && !isLoading) {
      onSendMessage(input.trim(), image || undefined);
      setInput('');
      setImage(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
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

  const handleToolSelect = (task: Task) => {
    if (task === 'brand-positioning') {
        onSendAnalysis(task, {});
    } else {
        setActiveTool({ task });
    }
  };

  const quickActionClass = "flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg px-3 py-2 transition-all duration-200 border border-slate-200 dark:border-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm hover:-translate-y-0.5";
  
  const baseInputClass = "flex-1 w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 shadow-sm pr-12";
  const recordingInputClass = "border-2 border-blue-500 animate-listening";
  const defaultInputClass = "border border-slate-300 dark:border-slate-700";

  if (activeTool) {
    return (
        <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md border-t border-slate-200 dark:border-slate-700">
            <GuidedInputForm 
                task={activeTool.task}
                initialData={activeTool.initialData}
                businessProfile={businessProfile}
                onSubmit={onSendAnalysis}
                onCancel={() => setActiveTool(null)}
                isLoading={isLoading}
            />
        </div>
    );
  }

  return (
    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex flex-wrap justify-center gap-2 mb-3">
             <button onClick={() => handleToolSelect('profit-analysis')} className={quickActionClass} disabled={isLoading}>
                <ChartBarIcon className="w-4 h-4 text-blue-500" />
                <span>Phân tích Lợi nhuận</span>
            </button>
            <button onClick={() => handleToolSelect('promo-price')} className={quickActionClass} disabled={isLoading}>
                <TagIcon className="w-4 h-4 text-green-500" />
                <span>Phân tích Khuyến mãi</span>
            </button>
             <button onClick={() => handleToolSelect('group-price')} className={quickActionClass} disabled={isLoading}>
                <CollectionIcon className="w-4 h-4 text-purple-500" />
                <span>Phân tích Đồng giá</span>
            </button>
             <button onClick={() => handleToolSelect('brand-positioning')} className={quickActionClass} disabled={isLoading}>
                <MapIcon className="w-4 h-4 text-teal-500" />
                <span>Định vị Thương hiệu</span>
            </button>
            <button onClick={() => handleToolSelect('market-research')} className={quickActionClass} disabled={isLoading}>
                <GlobeAltIcon className="w-4 h-4 text-orange-500" />
                <span>Nghiên cứu Xu hướng</span>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setIsMenuOpen(p => !p)} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50">
                    <DotsVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute bottom-full mb-2 w-56 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 z-10 animate-fade-in-up">
                        <button onClick={() => { onNewChat(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">
                            <PlusIcon className="w-4 h-4" />
                            <span>Trò chuyện mới</span>
                        </button>
                         <button onClick={() => { onExportChat(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">
                            <ArchiveBoxIcon className="w-4 h-4" />
                            <span>Xuất cuộc trò chuyện</span>
                        </button>
                        <div className="my-1 h-px bg-slate-200 dark:bg-slate-600"></div>
                        <button onClick={() => { onClearChat(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-200">
                            <TrashIcon className="w-4 h-4" />
                            <span>Xóa tin nhắn hiện tại</span>
                        </button>
                    </div>
                )}
            </div>
             <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50" disabled={isLoading} title="Đính kèm ảnh">
                <PaperclipIcon className="w-5 h-5" />
              </button>
            <div className="relative flex-1">
                 {image && (
                    <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 animate-fade-in-up">
                        <img src={image.dataUrl} alt="Image preview" className="w-20 h-20 object-cover rounded" />
                        <button
                            onClick={() => {
                                setImage(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute -top-2 -right-2 bg-slate-600 text-white rounded-full p-0.5 hover:bg-slate-800 transition-colors"
                            aria-label="Xóa ảnh"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isRecording ? "Đang lắng nghe..." : "Nhập yêu cầu hoặc đính kèm ảnh..."}
                    disabled={isLoading}
                    className={`${baseInputClass} ${isRecording ? recordingInputClass : defaultInputClass}`}
                    autoComplete="off"
                />
                {isSpeechSupported && (
                    <button
                        type="button"
                        onClick={handleToggleRecording}
                        disabled={isLoading}
                        className={`absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-slate-500 dark:text-slate-400 transition-colors duration-200 rounded-r-full ${isRecording ? 'text-red-500 animate-pulse-mic' : 'hover:text-blue-500 dark:hover:text-blue-400'}`}
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
                    aria-label="Dừng"
                    title="Dừng"
                >
                    <StopIcon className="w-6 h-6" />
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={(!input.trim() && !image) || isLoading}
                    className="text-white rounded-full p-3 hover:opacity-90 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 hover:scale-105 active:scale-95"
                    aria-label="Gửi tin nhắn"
                    style={{ background: 'var(--brand-gradient)' }}
                >
                    <PaperAirplaneIcon className="w-6 h-6" />
                </button>
            )}
        </form>
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
    @keyframes listening-glow {
      0%, 100% {
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
      }
      50% {
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
      }
    }
    .animate-listening {
      animation: listening-glow 1.5s infinite ease-in-out;
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