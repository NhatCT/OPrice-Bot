// NOTE FOR DEVELOPER:
// This application runs entirely in the browser and connects directly to the Google Gemini API.
// To make it work, you need to ensure the Gemini API key is correctly configured in the execution environment.
// The backend-dependent code has been removed to resolve "Failed to fetch" errors.

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
// FIX: Removed unused 'summarizeTitle' import as it is no longer exported from geminiService.
import { getChatResponseStream } from './services/geminiService';
import * as apiService from './services/apiService';
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
import { AnalysisChart } from './components/charts/AnalysisChart';


const THEME_KEY = 'theme';
const FONT_KEY = 'font';
const SOUND_ENABLED_KEY = 'soundEnabled';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId'; // Still needed for session resume

const generateSummaryForTask = (task: Task, params: any): string => {
    switch (task) {
        case 'profit-analysis':
            return `Yêu cầu "Phân tích Lợi nhuận" cho sản phẩm "${params.productName}".`;
        case 'promo-price':
            return `Yêu cầu "Phân tích Khuyến mãi" cho sản phẩm "${params.productName}".`;
        case 'group-price':
            const price = Number(params.flatPrice).toLocaleString('vi-VN');
            return `Yêu cầu "Phân tích Đồng giá" với mức giá ${price} VND.`;
        default:
            return "Yêu cầu phân tích tùy chỉnh.";
    }
}

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Record<string, ConversationMeta>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationMessages, setActiveConversationMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
  
  const handleNewChat = useCallback(async (setSidebarOpen = true) => {
    const newConversation = await apiService.createNewConversation();
    if (newConversation) {
        setConversations(prev => ({...prev, [newConversation.id]: newConversation }));
        setActiveConversationId(newConversation.id);
    }
    
    setIsLoading(false);
    setActiveTool(null);
    if (setSidebarOpen) setIsSidebarOpen(false);
  }, []);

  // Load initial data from API service
  useEffect(() => {
    const loadInitialData = async () => {
        try {
            const [profile, loadedConversations] = await Promise.all([
                apiService.loadUserProfile(),
                apiService.loadConversations()
            ]);
            
            setUserProfile(profile);

            if (loadedConversations && Object.keys(loadedConversations).length > 0) {
                setConversations(loadedConversations);
                const savedActiveId = window.localStorage.getItem(ACTIVE_CONVERSATION_ID_KEY);
                const lastId = Object.keys(loadedConversations).sort((a,b) => Number(b) - Number(a))[0];
                setActiveConversationId(savedActiveId && loadedConversations[savedActiveId] ? savedActiveId : lastId || null);
            } else {
                // Create a new conversation if none exist
                handleNewChat(false); // don't set sidebar open on initial load
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
            handleNewChat(false); // fallback to new chat on error
        }
    };
    loadInitialData();
  }, [handleNewChat]);

  // Load messages when active conversation changes
  useEffect(() => {
    const loadMessagesForActiveConvo = async () => {
      if (activeConversationId) {
        try {
          setIsLoading(true);
          const messages = await apiService.loadMessages(activeConversationId);
          setActiveConversationMessages(messages);
          setComparisonSelection([]);
          window.localStorage.setItem(ACTIVE_CONVERSATION_ID_KEY, activeConversationId);
        } catch (error) {
          console.error(`Failed to load messages for conversation ${activeConversationId}:`, error);
          setActiveConversationMessages([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setActiveConversationMessages([]);
      }
    };
    loadMessagesForActiveConvo();
  }, [activeConversationId]);
  
  // Save messages whenever they change
  useEffect(() => {
    if (activeConversationId && activeConversationMessages.length > 0) {
        apiService.saveMessages(activeConversationId, activeConversationMessages);
    }
  }, [activeConversationId, activeConversationMessages]);

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
      if (!newTitle.trim() || !conversations[id]) return;
      
      const originalTitle = conversations[id].title;
      if (originalTitle === newTitle.trim()) return;

      // Optimistic UI update
      setConversations(prev => ({
          ...prev,
          [id]: { ...prev[id], title: newTitle.trim() }
      }));
      
      const { success } = await apiService.saveConversationMeta(id, { title: newTitle.trim() });
      if (!success) {
        // Rollback on failure
        setConversations(prev => ({
            ...prev,
            [id]: { ...prev[id], title: originalTitle }
        }));
        // Optional: show an error toast to the user
      }
  }, [conversations]);
  
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const sendMessage = useCallback(async (userInput: string, analysisPayload?: { params: any; task: Task }) => {
    let currentConvoId = activeConversationId;
    if (!currentConvoId) {
        const newConvo = await apiService.createNewConversation();
        if (newConvo) {
            currentConvoId = newConvo.id;
            setConversations(prev => ({ ...prev, [newConvo.id]: newConvo }));
            setActiveConversationId(newConvo.id);
        } else {
            console.error("Could not create a new conversation.");
            return;
        }
    }

    if (analysisPayload) {
        pendingAnalysisParamsRef.current = analysisPayload;
    }

    const initialMessages = [...activeConversationMessages];

    // Clean up suggestions from the previous message
    if (initialMessages.length > 0) {
        const lastMsg = initialMessages[initialMessages.length - 1];
        if (lastMsg.role === 'model' && lastMsg.suggestions) {
            const { suggestions, ...rest } = lastMsg;
            initialMessages[initialMessages.length - 1] = rest;
        }
    }
    
    let messagesForApi = [...initialMessages];
    let titleSource = userInput;

    if (analysisPayload) {
        const summary = generateSummaryForTask(analysisPayload.task, analysisPayload.params);
        messagesForApi.push({ role: 'user', content: summary }); // For display
        messagesForApi.push({ role: 'user', content: userInput }); // The real prompt for API
        titleSource = summary;
    } else if (userInput) {
        messagesForApi.push({ role: 'user', content: userInput });
    } else {
        return; // Do nothing if there's no input
    }
    
    const displayMessages = analysisPayload 
        ? [...initialMessages, { role: 'user' as const, content: generateSummaryForTask(analysisPayload.task, analysisPayload.params) }]
        : messagesForApi;

    setActiveConversationMessages(displayMessages);
    setComparisonSelection([]);
    setIsLoading(true);
    setActiveTool(null);
    setIsSidebarOpen(false);
    playSound(typingAudio);

    const needsTitle = displayMessages.length === 1 && conversations[currentConvoId]?.title === "Cuộc trò chuyện mới";
    
    // Add placeholder for model's response
    setActiveConversationMessages(prev => [...prev, { role: 'model', content: '' }]);
    
    abortControllerRef.current = new AbortController();
    let generationSuccess = false;
    let fullText = '';

    try {
      const stream = getChatResponseStream(messagesForApi, abortControllerRef.current.signal);
      for await (const chunk of stream) {
        if (chunk.textChunk) {
          fullText += chunk.textChunk;
          setActiveConversationMessages(prev => {
            const newMsgs = [...prev];
            const lastMsg = newMsgs[newMsgs.length - 1];
            if (lastMsg.role === 'model') {
              newMsgs[newMsgs.length - 1] = { ...lastMsg, role: 'model', content: fullText };
            }
            return newMsgs;
          });
        }
        if (chunk.isFinal) {
          generationSuccess = !chunk.error;
          setActiveConversationMessages(prev => {
            const newMsgs = [...prev];
            const originalLastMsg = newMsgs[newMsgs.length - 1];
            if (originalLastMsg?.role === 'model') {
              // FIX: Create a new object in a single expression to resolve issues
              // with type widening from spreading a discriminated union member.
              newMsgs[newMsgs.length - 1] = {
                ...originalLastMsg,
                role: 'model',
                content: chunk.error || originalLastMsg.content,
                sources: chunk.sources || originalLastMsg.sources,
                performance: chunk.performanceMetrics || originalLastMsg.performance,
              };
            }
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
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg?.role === 'model') {
            newMsgs[newMsgs.length - 1] = { ...lastMsg, role: 'model', content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại."};
          }
          return newMsgs;
        });
      }
    } finally {
      setIsLoading(false);
      typingAudio.pause();
      if (generationSuccess) playSound(messageAudio);
      abortControllerRef.current = null;

      const analysisData = pendingAnalysisParamsRef.current;
      pendingAnalysisParamsRef.current = null;

      const wasPricingTask = !!analysisData;
      let parsedData: any = null;

      if (wasPricingTask && generationSuccess && fullText) {
          try {
            parsedData = JSON.parse(fullText);
          } catch (e) {
            console.error("Failed to parse JSON from AI response:", e, "\nResponse was:", fullText);
          }
      }

      // Consolidate final message updates
      setActiveConversationMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0) {
          const originalLastMsg = newMsgs[newMsgs.length - 1];
          if (originalLastMsg.role === 'model') {
            // FIX: Create a new object in a single expression to resolve issues
            // with type widening from spreading a discriminated union member.
            let component: React.ReactNode | undefined = originalLastMsg.component;
            if (parsedData && parsedData.analysis && Array.isArray(parsedData.charts)) {
              component = (
                <div>
                  {parsedData.charts.map((chart: any, index: number) => (
                    <AnalysisChart key={index} chart={chart} theme={effectiveTheme} />
                  ))}
                </div>
              );
            }
            newMsgs[newMsgs.length - 1] = {
              ...originalLastMsg,
              role: 'model',
              ...(analysisData && {
                analysisParams: analysisData.params,
                task: analysisData.task,
              }),
              ...(parsedData && parsedData.analysis && Array.isArray(parsedData.charts) && {
                content: parsedData.analysis,
                component,
              }),
            };
          }
        }
        return newMsgs;
      });

      if (needsTitle && generationSuccess && titleSource && currentConvoId) {
          const tempTitle = titleSource.length > 30 ? titleSource.substring(0, 30) + "..." : titleSource;
          handleRenameConversation(currentConvoId, tempTitle);
      }
    }
  }, [activeConversationId, activeConversationMessages, handleRenameConversation, typingAudio, messageAudio, playSound, effectiveTheme, conversations]);

  const handleClearChat = async (id: string) => {
    if (id === activeConversationId) {
        setActiveConversationMessages([]);
        setComparisonSelection([]);
    }
    await apiService.clearConversationMessages(id);
    setIsConfirmDialogOpen(null);
    setActiveTool(null);
  };

  const handleDeleteConversation = async (id: string) => {
    const oldConversations = conversations;
    
    // Optimistic UI update
    const newConversations = { ...oldConversations };
    delete newConversations[id];
    setConversations(newConversations);

    const { success } = await apiService.deleteConversation(id);
    if (!success) {
        setConversations(oldConversations); // Rollback on failure
    }
    
    if (activeConversationId === id) {
        const remainingIds = Object.keys(oldConversations)
            .filter(convoId => convoId !== id)
            .sort((a, b) => Number(b) - Number(a));
        
        if (remainingIds.length > 0) {
            setActiveConversationId(remainingIds[0]);
        } else {
            await handleNewChat();
        }
    }
    setIsConfirmDialogOpen(null);
  };
  
  const handleFeedback = async (messageIndex: number, feedback: 'positive' | 'negative', comment?: string) => {
    const updatedMessages = [...activeConversationMessages];
    const messageToUpdate = updatedMessages[messageIndex];

    if (messageToUpdate && messageToUpdate.role === 'model' && messageToUpdate.id) {
        // Optimistically update UI
        const originalMessage = { ...messageToUpdate };
        // FIX: Re-specify role to prevent type widening on spread.
        updatedMessages[messageIndex] = { 
            ...messageToUpdate,
            role: 'model',
            feedback,
            feedbackComment: comment,
        };
        setActiveConversationMessages(updatedMessages);

        // Send feedback to the backend with the message ID
        const { success } = await apiService.sendFeedback({
            messageId: messageToUpdate.id,
            feedback,
            comment
        });
        
        if (!success) {
            // Rollback on failure
            updatedMessages[messageIndex] = originalMessage;
            setActiveConversationMessages(updatedMessages);
        }
    } else {
        console.error("Feedback cannot be given for this message (missing ID or not a model message).", messageToUpdate);
    }
  };
  
  const handleProfileUpdate = async (profile: UserProfile) => {
    setUserProfile(profile);
    await apiService.saveUserProfile(profile);
  };
  
  const handleForgetUser = async () => {
    const keysToRemove = [ACTIVE_CONVERSATION_ID_KEY];
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
    
    const currentConvos = { ...conversations };
    for (const id in currentConvos) {
        await apiService.deleteConversation(id);
    }

    setUserProfile(null);
    setConversations({});
    setActiveConversationId(null);
    await handleNewChat(false); // Start a fresh session
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
            backgroundColor: effectiveTheme === 'dark' ? '#020617' : '#ffffff',
            pixelRatio: 2,
        });
        const convoTitle = (activeConversationId && conversations[activeConversationId]?.title) || 'conversation';
        const safeTitle = convoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
        if (msg.role === 'model' && msg.sources && msg.sources.length > 0) {
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
    sendMessage(prompt, { params, task: activeTool!.task });
  };

  return (
    <div className={`flex h-dvh bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300`}>
        <Sidebar 
            conversations={Object.values(conversations)}
            activeConversationId={activeConversationId}
            onNewChat={() => handleNewChat()}
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
                {activeConversationMessages.length === 0 && !isLoading ? (
                    <Welcome onSuggestionClick={(prompt) => sendMessage(prompt)} onToolSelect={(task) => setActiveTool({ task })} />
                ) : (
                    <ChatWindow 
                        ref={chatWindowRef}
                        messages={activeConversationMessages}
                        isLoading={isLoading && !activeTool}
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
                    isLoading={isLoading}
                    onNewChat={() => handleNewChat()}
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