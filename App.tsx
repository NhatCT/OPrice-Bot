import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { getChatResponseStream, summarizeTitle } from './services/geminiService';
import type { ChatMessage, UserProfile, Theme, Font, ConversationMeta, Task } from './types';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { SettingsPopover } from './components/SettingsPopover';
import { Welcome } from './components/Welcome';
import { Sidebar } from './components/Sidebar';
import { MenuIcon } from './components/icons/MenuIcon';
import { typingSound } from './assets/typingSound';
import { messageReceivedSound } from './assets/messageReceivedSound';
import { WorkflowDialog } from './components/WorkflowDialog';
import { WorkflowIcon } from './components/icons/WorkflowIcon';
import { TestingGuideDialog } from './components/TestingGuideDialog';
import { CheckBadgeIcon } from './components/icons/CheckBadgeIcon';
import { ComparisonToolbar } from './components/ComparisonToolbar';
import { SourceComparisonDialog } from './components/SourceComparisonDialog';
import { ExportDialog } from './components/ExportDialog';
import { ArrowDownTrayIcon } from './components/icons/ArrowDownTrayIcon';
import { toPng } from 'html-to-image';
import type { FunctionCall } from '@google/genai';
import { AnalysisChart } from './components/charts/AnalysisChart';


const CONVERSATIONS_KEY = 'conversations';
const CONVERSATION_MESSAGES_KEY_PREFIX = 'conversation_messages_';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId';
const THEME_KEY = 'theme';
const FONT_KEY = 'font';
const USER_PROFILE_KEY = 'userProfile';
const SOUND_ENABLED_KEY = 'soundEnabled';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Record<string, ConversationMeta>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationMessages, setActiveConversationMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<{ action: 'clear' | 'delete'; id?: string } | null>(null);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isTestingGuideOpen, setIsTestingGuideOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTool, setActiveTool] = useState<{ task: Task; initialData?: Record<string, any> } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [comparisonSelection, setComparisonSelection] = useState<number[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const pendingAnalysisParamsRef = useRef<{ params: any; task: Task } | null>(null);


  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'system');
  const [font, setFont] = useState<Font>(() => (localStorage.getItem(FONT_KEY) as Font) || 'sans');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(SOUND_ENABLED_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [osPrefersDark, setOsPrefersDark] = useState(() => 
      typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  const typingAudio = useMemo(() => new Audio(typingSound), []);
  const messageAudio = useMemo(() => new Audio(messageReceivedSound), []);
  
  typingAudio.volume = 0.5;
  messageAudio.volume = 0.6;
  
  const playSound = (audio: HTMLAudioElement) => {
    if (soundEnabled) {
        audio.currentTime = 0;
        audio.play().catch(error => console.error("Error playing sound:", error));
    }
  };

  useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setOsPrefersDark(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const effectiveTheme = theme === 'system' ? (osPrefersDark ? 'dark' : 'light') : theme;

  useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
      localStorage.setItem(THEME_KEY, theme);
  }, [theme, effectiveTheme]);

  useEffect(() => {
    document.body.classList.remove('font-sans', 'font-serif', 'font-mono');
    document.body.classList.add(`font-${font}`);
    localStorage.setItem(FONT_KEY, font);
  }, [font]);
  
  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(soundEnabled));
  }, [soundEnabled]);
  
  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(USER_PROFILE_KEY);
      const profile = savedProfile ? JSON.parse(savedProfile) : null;
      setUserProfile(profile);

      const savedConversationsRaw = window.localStorage.getItem(CONVERSATIONS_KEY);
      const savedActiveId = window.localStorage.getItem(ACTIVE_CONVERSATION_ID_KEY);

      let loadedConversations: Record<string, ConversationMeta> | null = null;

      if (savedConversationsRaw) {
        const savedData = JSON.parse(savedConversationsRaw);
        const firstConvoId = Object.keys(savedData)[0];
        
        if (firstConvoId && savedData[firstConvoId] && typeof savedData[firstConvoId].messages !== 'undefined') {
          console.log("Migrating old conversation data to new optimized format.");
          const newMetas: Record<string, ConversationMeta> = {};
          Object.values(savedData).forEach((convo: any) => {
            if (convo.id && convo.title && Array.isArray(convo.messages)) {
              newMetas[convo.id] = { id: convo.id, title: convo.title };
              const messagesToSave = JSON.parse(JSON.stringify(convo.messages, (key, value) => {
                  if (key === 'component') return undefined;
                  return value;
              }));
              window.localStorage.setItem(`${CONVERSATION_MESSAGES_KEY_PREFIX}${convo.id}`, JSON.stringify(messagesToSave));
            }
          });
          window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(newMetas));
          loadedConversations = newMetas;
        } else {
          loadedConversations = savedData;
        }
      }

      if (loadedConversations && Object.keys(loadedConversations).length > 0) {
        setConversations(loadedConversations);
        setActiveConversationId(savedActiveId && loadedConversations[savedActiveId] ? savedActiveId : Object.keys(loadedConversations)[0] || null);
      } else {
        const newId = Date.now().toString();
        const initialConvo: ConversationMeta = {
          id: newId,
          title: "Cuộc trò chuyện mới",
        };
        setConversations({ [newId]: initialConvo });
        setActiveConversationId(newId);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      const newId = Date.now().toString();
      const initialConvo: ConversationMeta = {
        id: newId,
        title: "Cuộc trò chuyện mới",
      };
      setConversations({ [newId]: initialConvo });
      setActiveConversationId(newId);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      try {
        const savedMessagesRaw = window.localStorage.getItem(`${CONVERSATION_MESSAGES_KEY_PREFIX}${activeConversationId}`);
        setActiveConversationMessages(savedMessagesRaw ? JSON.parse(savedMessagesRaw) : []);
        setComparisonSelection([]);
      } catch (error) {
        console.error(`Failed to load messages for conversation ${activeConversationId}:`, error);
        setActiveConversationMessages([]);
      }
    } else {
      setActiveConversationMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    try {
      if (Object.keys(conversations).length > 0) {
        window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
      }
      if (activeConversationId) {
        window.localStorage.setItem(ACTIVE_CONVERSATION_ID_KEY, activeConversationId);
      }
    } catch (error) {
      console.error('Failed to save metadata to localStorage:', error);
    }
  }, [conversations, activeConversationId]);
  
  useEffect(() => {
    if (activeConversationId) {
        try {
            const messagesToSave = JSON.parse(JSON.stringify(activeConversationMessages, (key, value) => {
                if (key === 'component' || key === 'isExecuting' || key === 'toolCall') return undefined;
                return value;
            }));
            window.localStorage.setItem(`${CONVERSATION_MESSAGES_KEY_PREFIX}${activeConversationId}`, JSON.stringify(messagesToSave));
        } catch (error) {
            console.error('Failed to save messages to localStorage:', error);
        }
    }
  }, [activeConversationId, activeConversationMessages]);

  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      setConversations(prev => ({
          ...prev,
          [id]: { ...prev[id], title: newTitle.trim() }
      }));
  }, []);
  
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setIsExecutingTool(false);
  };

  const handleFunctionExecution = useCallback(async (functionCall: FunctionCall) => {
    setIsExecutingTool(true);
    let functionResult;

    // Simulate API call to a backend system
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (functionCall.name === 'createDiscountCode') {
        console.log('Executing function createDiscountCode with args:', functionCall.args);
        // In a real app, you would call your backend here.
        functionResult = { status: "thành công", message: `Mã ${functionCall.args.codeName} đã được tạo.` };
    } else {
        functionResult = { status: "lỗi", message: "Không tìm thấy công cụ." };
    }
    
    setIsExecutingTool(false);
    
    // Send the result back to the model to get a final natural language response
    sendMessage(
      '', // No user text, we're continuing the conversation
      { name: functionCall.name, response: { result: functionResult } }
    );

  }, [/* dependencies for sendMessage */ activeConversationId, activeConversationMessages, handleRenameConversation]);


  const sendMessage = useCallback(async (userInput: string, functionResponse?: {name: string, response: any}, analysisPayload?: { params: any; task: Task }) => {
    if (!activeConversationId) return;

    if (analysisPayload) {
        pendingAnalysisParamsRef.current = analysisPayload;
    }

    let currentMessages = activeConversationMessages;

    // Add user message if there is input
    if (userInput) {
        const userMessage: ChatMessage = { role: 'user', content: userInput };
        currentMessages = [...currentMessages, userMessage];
    }
    
    // Clean up suggestions from previous message
    if (currentMessages.length > 1) {
      const lastMsg = currentMessages[currentMessages.length - 2];
      const { suggestions, ...rest } = lastMsg;
      currentMessages[currentMessages.length - 2] = rest;
    }

    const historyForApi = currentMessages.map(m => ({ ...m, component: undefined }));
    const wasPricingTask = !!activeTool || !!analysisPayload;
    const expectsJsonResponse = wasPricingTask && !(analysisPayload?.params?.useMarket);

    setActiveConversationMessages(currentMessages);
    setComparisonSelection([]);

    setIsLoading(true);
    setActiveTool(null);
    setIsSidebarOpen(false);
    if(!functionResponse) playSound(typingAudio);

    const needsTitle = currentMessages.length === (userInput ? 1 : 0);
    
    // Add placeholder for model's response
    setActiveConversationMessages(prev => [...prev, { role: 'model', content: '' }]);
    
    abortControllerRef.current = new AbortController();
    let generationSuccess = false;
    let fullText = '';

    try {
      const stream = getChatResponseStream(historyForApi, abortControllerRef.current.signal, functionResponse);
      for await (const chunk of stream) {
        if (chunk.functionCall) {
            setActiveConversationMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { 
                    role: 'model', 
                    content: `Đang thực thi: ${chunk.functionCall.name}...`,
                    isExecuting: true,
                    toolCall: chunk.functionCall
                };
                return newMsgs;
            });
            handleFunctionExecution(chunk.functionCall);
            // Stop processing this stream, as a new one will be started after execution
            return; 
        }

        if (chunk.textChunk) {
          fullText += chunk.textChunk;
          setActiveConversationMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: fullText, isExecuting: false };
            return newMsgs;
          });
        }
        if (chunk.isFinal) {
          generationSuccess = !chunk.error;
          setActiveConversationMessages(prev => {
            const newMsgs = [...prev];
            const lastMsg = { ...newMsgs[newMsgs.length - 1] };
            if (chunk.error) lastMsg.content = chunk.error;
            if (chunk.sources) lastMsg.sources = chunk.sources;
            if (chunk.performanceMetrics) lastMsg.performance = chunk.performanceMetrics;
            newMsgs[newMsgs.length - 1] = lastMsg;
            return newMsgs;
          });
          break;
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Stream failed:", error);
        setActiveConversationMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại."};
          return newMsgs;
        });
      }
    } finally {
      setIsLoading(false);
      typingAudio.pause();
      if(generationSuccess) playSound(messageAudio);
      abortControllerRef.current = null;

      // FIX: Capture ref value before state update to prevent race condition.
      // The state updater function runs later, by which time the ref might be cleared.
      if (pendingAnalysisParamsRef.current) {
        const analysisData = pendingAnalysisParamsRef.current;
        setActiveConversationMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs.length > 0) {
              const lastMsg = { ...newMsgs[newMsgs.length - 1] };
              lastMsg.analysisParams = analysisData.params;
              lastMsg.task = analysisData.task;
              newMsgs[newMsgs.length - 1] = lastMsg;
            }
            return newMsgs;
        });
        pendingAnalysisParamsRef.current = null;
      }

      // FIX: Handle JSON parsing for charts only when a JSON response was expected.
      // Analysis tasks with market data requests will return Markdown instead of JSON.
      if (expectsJsonResponse && generationSuccess && fullText) {
          try {
              const parsedData = JSON.parse(fullText);
              if (parsedData.analysis && Array.isArray(parsedData.charts)) {
                  setActiveConversationMessages(prev => {
                      const newMsgs = [...prev];
                      const lastMsg = { ...newMsgs[newMsgs.length - 1] };
                      lastMsg.content = parsedData.analysis;
                      lastMsg.component = (
                          <div>
                              {parsedData.charts.map((chart: any, index: number) => (
                                  <AnalysisChart key={index} chart={chart} theme={effectiveTheme} />
                              ))}
                          </div>
                      );
                      newMsgs[newMsgs.length - 1] = lastMsg;
                      return newMsgs;
                  });
              }
          } catch (e) {
              console.error("Failed to parse analysis JSON:", e);
              // Fallback to showing the raw text if parsing fails
          }
      }

      if (needsTitle && generationSuccess && userInput) {
          summarizeTitle(userInput).then(title => {
              handleRenameConversation(activeConversationId, title);
          });
      }
    }
  }, [activeConversationId, activeConversationMessages, handleRenameConversation, typingAudio, messageAudio, playSound, handleFunctionExecution, activeTool, effectiveTheme]);

   const handleNewChat = () => {
    const newId = Date.now().toString();
    const newConversation: ConversationMeta = {
      id: newId,
      title: "Cuộc trò chuyện mới",
    };
    setConversations(prev => ({ ...prev, [newId]: newConversation }));
    setActiveConversationId(newId);
    setIsLoading(false);
    setActiveTool(null);
    setIsSidebarOpen(false);
  };

  const handleClearChat = (id: string) => {
    if (id === activeConversationId) {
        setActiveConversationMessages([]);
        setComparisonSelection([]);
    }
    window.localStorage.removeItem(`${CONVERSATION_MESSAGES_KEY_PREFIX}${id}`);
    setIsConfirmDialogOpen(null);
    setActiveTool(null);
  };

  const handleDeleteConversation = (id: string) => {
    const oldConversations = conversations;
    setConversations(prev => {
        const newConversations = { ...prev };
        delete newConversations[id];
        return newConversations;
    });
    
    window.localStorage.removeItem(`${CONVERSATION_MESSAGES_KEY_PREFIX}${id}`);
    
    if (activeConversationId === id) {
        const remainingIds = Object.keys(oldConversations)
            .filter(convoId => convoId !== id)
            .sort((a, b) => Number(b) - Number(a));
        
        if (remainingIds.length > 0) {
            setActiveConversationId(remainingIds[0]);
        } else {
            handleNewChat();
        }
    }
    setIsConfirmDialogOpen(null);
  };
  
  const handleFeedback = (messageIndex: number, feedback: 'positive' | 'negative') => {
    setActiveConversationMessages(prev => {
      const newMessages = [...prev];
      if (newMessages[messageIndex]) {
        newMessages[messageIndex] = { ...newMessages[messageIndex], feedback };
      }
      return newMessages;
    });
  };
  
  const handleProfileUpdate = (profile: UserProfile) => {
    setUserProfile(profile);
    window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  };
  
  const handleForgetUser = () => {
    const keysToRemove = [USER_PROFILE_KEY, CONVERSATIONS_KEY, ACTIVE_CONVERSATION_ID_KEY];
    Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith(CONVERSATION_MESSAGES_KEY_PREFIX)) {
            keysToRemove.push(key);
        }
    });
    keysToRemove.forEach(key => window.localStorage.removeItem(key));

    setUserProfile(null);
    const newId = Date.now().toString();
    const initialConvo: ConversationMeta = {
        id: newId,
        title: "Cuộc trò chuyện mới",
    };
    setConversations({ [newId]: initialConvo });
    setActiveConversationId(newId);
  };
  
  const handleToggleCompare = (index: number) => {
    setComparisonSelection(prev => {
        const isSelected = prev.includes(index);
        if (isSelected) {
            return prev.filter(i => i !== index);
        }
        if (prev.length < 2) {
            return [...prev, index].sort((a, b) => a - b);
        }
        // Replace the first item in the sorted array when adding a third.
        return [prev[1], index].sort((a, b) => a - b);
    });
  };

  const handleClearCompare = () => {
      setComparisonSelection([]);
  };

  const handleEditAnalysis = useCallback((message: ChatMessage) => {
    if (message.task && message.analysisParams) {
        setActiveTool({ task: message.task, initialData: message.analysisParams });
        setIsSidebarOpen(false);
    }
  }, []);
  
  const handleExportPng = useCallback(async () => {
    if (!chatWindowRef.current) {
        alert('Không thể tìm thấy nội dung chat để xuất.');
        return;
    }
    setIsExporting(true);
    try {
        const dataUrl = await toPng(chatWindowRef.current, { 
            cacheBust: true, 
            backgroundColor: effectiveTheme === 'dark' ? '#020617' : '#ffffff', // dark:bg-gray-950
            pixelRatio: 2,
        });
        const convoTitle = (activeConversationId && conversations[activeConversationId]?.title) || 'conversation';
        const safeTitle = convoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        // FIX: Declare the 'link' variable before using it to trigger the download.
        const link = document.createElement('a');
        link.download = `conversation-V64-${safeTitle}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Không thể xuất ảnh PNG:', err);
        alert('Đã xảy ra lỗi khi xuất ảnh. Vui lòng thử lại.');
    } finally {
        setIsExporting(false);
        setIsExportDialogOpen(false);
    }
  }, [effectiveTheme, activeConversationId, conversations]);

  const handleExportTxt = useCallback(() => {
    setIsExporting(true);
    const convoTitle = (activeConversationId && conversations[activeConversationId]?.title) || 'Cuộc trò chuyện';
    
    let textContent = `Chủ đề: ${convoTitle}\n`;
    textContent += `Ngày xuất: ${new Date().toLocaleString('vi-VN')}\n`;
    textContent += "========================================\n\n";

    activeConversationMessages.forEach(msg => {
        const prefix = msg.role === 'user' ? '[Người dùng]' : '[AI - V64]';
        textContent += `${prefix}:\n${msg.content}\n\n`;
        if (msg.sources && msg.sources.length > 0) {
            textContent += 'Nguồn tham khảo:\n';
            msg.sources.forEach(source => {
                textContent += `- ${source.title}: ${source.uri}\n`;
            });
            textContent += '\n';
        }
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = convoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `conversation-V64-${safeTitle}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
    setIsExportDialogOpen(false);
  }, [activeConversationId, conversations, activeConversationMessages]);

  const handleSendAnalysis = (prompt: string, params: Record<string, any>) => {
    sendMessage(prompt, undefined, { params, task: activeTool!.task });
  };

  return (
    <div className={`flex h-dvh bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300`}>
        <Sidebar 
            conversations={Object.values(conversations)}
            activeConversationId={activeConversationId}
            onNewChat={handleNewChat}
            onSelectConversation={(id) => setActiveConversationId(id)}
            onDeleteConversation={(id) => setIsConfirmDialogOpen({ action: 'delete', id })}
            onRenameConversation={handleRenameConversation}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
        />
        
        <main className="flex flex-col flex-1 h-dvh relative">
            <header className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm shrink-0 z-10">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 md:hidden">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {(activeConversationId && conversations[activeConversationId]?.title) || 'Trợ lý Kinh doanh'}
                    </h1>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsExportDialogOpen(true)}
                        disabled={activeConversationMessages.length === 0}
                        className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title="Xuất cuộc trò chuyện"
                    >
                        <ArrowDownTrayIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsTestingGuideOpen(true)}
                        className="hidden md:flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Hướng dẫn kiểm thử"
                    >
                        <CheckBadgeIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsWorkflowDialogOpen(true)}
                        className="hidden md:flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Xem quy trình làm việc"
                    >
                        <WorkflowIcon className="w-6 h-6" />
                    </button>
                    <SettingsPopover 
                        theme={theme}
                        setTheme={setTheme}
                        font={font}
                        setFont={setFont}
                        userProfile={userProfile}
                        onUpdateProfile={handleProfileUpdate}
                        onForgetUser={handleForgetUser}
                        soundEnabled={soundEnabled}
                        setSoundEnabled={setSoundEnabled}
                        onOpenWorkflow={() => setIsWorkflowDialogOpen(true)}
                        onOpenTestingGuide={() => setIsTestingGuideOpen(true)}
                    />
                </div>
            </header>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                {activeConversationMessages.length === 0 ? (
                    <Welcome onSuggestionClick={(prompt) => sendMessage(prompt)} onToolSelect={(task) => setActiveTool({ task })} />
                ) : (
                    <ChatWindow 
                        ref={chatWindowRef}
                        messages={activeConversationMessages}
                        isLoading={isLoading && !activeTool && !isExecutingTool}
                        onSuggestionClick={(prompt) => sendMessage(prompt)}
                        onFeedback={handleFeedback}
                        comparisonSelection={comparisonSelection}
                        onToggleCompare={handleToggleCompare}
                        onEditAnalysis={handleEditAnalysis}
                    />
                )}

                {comparisonSelection.length > 0 && (
                    <ComparisonToolbar
                        selection={comparisonSelection}
                        messages={activeConversationMessages}
                        onCompare={() => setIsComparisonOpen(true)}
                        onClear={handleClearCompare}
                    />
                )}

                <MessageInput 
                    onSendMessage={(prompt) => sendMessage(prompt)}
                    onSendAnalysis={handleSendAnalysis}
                    isLoading={isLoading || isExecutingTool}
                    onNewChat={handleNewChat}
                    onClearChat={() => activeConversationId && setIsConfirmDialogOpen({ action: 'clear', id: activeConversationId })}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    onStopGeneration={handleStopGeneration}
                />
            </div>
        </main>

        {isExportDialogOpen && (
            <ExportDialog
                isOpen={isExportDialogOpen}
                onClose={() => setIsExportDialogOpen(false)}
                onExportPng={handleExportPng}
                onExportTxt={handleExportTxt}
                isExporting={isExporting}
            />
        )}

        {isWorkflowDialogOpen && (
            <WorkflowDialog
                isOpen={isWorkflowDialogOpen}
                onClose={() => setIsWorkflowDialogOpen(false)}
            />
        )}
        
        {isTestingGuideOpen && (
            <TestingGuideDialog
                isOpen={isTestingGuideOpen}
                onClose={() => setIsTestingGuideOpen(false)}
            />
        )}

        {isComparisonOpen && comparisonSelection.length === 2 && (
            <SourceComparisonDialog
                isOpen={isComparisonOpen}
                onClose={() => setIsComparisonOpen(false)}
                message1={activeConversationMessages[comparisonSelection[0]]}
                message2={activeConversationMessages[comparisonSelection[1]]}
            />
        )}

        {isConfirmDialogOpen && (
            <ConfirmationDialog 
                isOpen={!!isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(null)}
                onConfirm={() => {
                    if (isConfirmDialogOpen.action === 'clear' && isConfirmDialogOpen.id) {
                        handleClearChat(isConfirmDialogOpen.id);
                    } else if (isConfirmDialogOpen.action === 'delete' && isConfirmDialogOpen.id) {
                        handleDeleteConversation(isConfirmDialogOpen.id);
                    }
                }}
                title={isConfirmDialogOpen.action === 'clear' ? "Xóa cuộc trò chuyện?" : "Xóa vĩnh viễn?"}
                message={
                    isConfirmDialogOpen.action === 'clear' 
                    ? "Bạn có chắc chắn muốn xóa tất cả tin nhắn trong cuộc trò chuyện này không? Hành động này không thể hoàn tác."
                    : "Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này không? Hành động này không thể hoàn tác."
                }
            />
        )}
    </div>
  );
};

export default App;