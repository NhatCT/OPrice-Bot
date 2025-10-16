import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { getChatResponseStream, summarizeTitle } from './services/geminiService';
import type { ChatMessage, UserProfile, Theme, Font, Conversation } from './types';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import type { Task } from './components/GuidedInputForm';
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


const CONVERSATIONS_KEY = 'conversations';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId';
const THEME_KEY = 'theme';
const FONT_KEY = 'font';
const USER_PROFILE_KEY = 'userProfile';
const SOUND_ENABLED_KEY = 'soundEnabled';

type ImageData = ChatMessage['image'];

const generateInitialMessage = (profile: UserProfile | null): ChatMessage => {
  if (profile) {
    return {
      role: 'model',
      content: `Chào mừng trở lại, ${profile.name}! Tôi có thể giúp gì cho bạn hôm nay?`,
    };
  }
  return {
    role: 'model',
    content: 'Xin chào! Tôi là trợ lý ảo của V64. Để cá nhân hóa trải nghiệm, tôi có thể gọi bạn là gì?',
  };
};


const App: React.FC = () => {
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<{ action: 'clear' | 'delete'; id?: string } | null>(null);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isTestingGuideOpen, setIsTestingGuideOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Task | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);


  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'system');
  const [font, setFont] = useState<Font>(() => (localStorage.getItem(FONT_KEY) as Font) || 'sans');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(SOUND_ENABLED_KEY);
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  });
  
  const [osPrefersDark, setOsPrefersDark] = useState(() => 
      typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;
  
  const typingAudio = useMemo(() => new Audio(typingSound), []);
  const messageAudio = useMemo(() => new Audio(messageReceivedSound), []);
  
  // Set volume for subtle effect
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
    localStorage.setItem(FONT_KEY, font);
  }, [font]);
  
  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(soundEnabled));
  }, [soundEnabled]);
  
  // Load initial state from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(USER_PROFILE_KEY);
      const profile = savedProfile ? JSON.parse(savedProfile) : null;
      setUserProfile(profile);

      const savedConversations = window.localStorage.getItem(CONVERSATIONS_KEY);
      const savedActiveId = window.localStorage.getItem(ACTIVE_CONVERSATION_ID_KEY);

      if (savedConversations) {
        const loadedConversations = JSON.parse(savedConversations);
        setConversations(loadedConversations);
        setActiveConversationId(savedActiveId && loadedConversations[savedActiveId] ? savedActiveId : Object.keys(loadedConversations)[0] || null);
      } else {
        const newId = Date.now().toString();
        const initialConvo: Conversation = {
          id: newId,
          title: "Cuộc trò chuyện mới",
          messages: [], // Start with an empty conversation for the Welcome screen
        };
        setConversations({ [newId]: initialConvo });
        setActiveConversationId(newId);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      const newId = Date.now().toString();
      const initialConvo: Conversation = {
        id: newId,
        title: "Cuộc trò chuyện mới",
        messages: [],
      };
      setConversations({ [newId]: initialConvo });
      setActiveConversationId(newId);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    try {
      if (Object.keys(conversations).length > 0) {
        const conversationsToSave = JSON.parse(JSON.stringify(conversations, (key, value) => {
            if (key === 'component') return undefined;
            return value;
        }));
        window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversationsToSave));
      }
      if (activeConversationId) {
        window.localStorage.setItem(ACTIVE_CONVERSATION_ID_KEY, activeConversationId);
      }
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [conversations, activeConversationId]);

  const updateActiveConversationMessages = useCallback((updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
    if (!activeConversationId) return;
    setConversations(prev => {
        const activeConvo = prev[activeConversationId];
        if (!activeConvo) return prev;
        const newMessages = updater(activeConvo.messages);
        return {
            ...prev,
            [activeConversationId]: { ...activeConvo, messages: newMessages }
        };
    });
  }, [activeConversationId]);

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
  };


  const sendMessage = useCallback(async (userInput: string, image?: ImageData) => {
    if (!activeConversationId) return;
    
    const userMessage: ChatMessage = { role: 'user', content: userInput, image };
    
    const currentConversation = conversations[activeConversationId];
    if (!currentConversation) return;

    const prevMessages = currentConversation.messages;

    const messagesForHistory = [...prevMessages];
    if (messagesForHistory.length > 0) {
      const lastMsg = messagesForHistory[messagesForHistory.length - 1];
      const { suggestions, ...rest } = lastMsg;
      messagesForHistory[messagesForHistory.length - 1] = rest;
    }
    messagesForHistory.push(userMessage);

    const historyForApi = messagesForHistory.map(m => ({ ...m, component: undefined }));

    updateActiveConversationMessages(() => messagesForHistory);

    setIsLoading(true);
    setActiveTool(null);
    setIsSidebarOpen(false);
    playSound(typingAudio);

    const needsTitle = prevMessages.length === 0;
    
    updateActiveConversationMessages(prev => [...prev, { role: 'model', content: '' }]);
    
    abortControllerRef.current = new AbortController();
    let generationSuccess = false;

    try {
      const stream = getChatResponseStream(historyForApi, abortControllerRef.current.signal);
      let fullText = '';
      for await (const chunk of stream) {
        if (chunk.textChunk) {
          fullText += chunk.textChunk;
          updateActiveConversationMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = {
              ...newMsgs[newMsgs.length - 1],
              content: fullText,
            };
            return newMsgs;
          });
        }
        if (chunk.isFinal) {
          generationSuccess = !chunk.error;
          updateActiveConversationMessages(prev => {
            const newMsgs = [...prev];
            const lastMsg = { ...newMsgs[newMsgs.length - 1] };
            if (chunk.error) {
              lastMsg.content = chunk.error;
            }
            if (chunk.sources && chunk.sources.length > 0) {
              lastMsg.sources = chunk.sources;
            }
            if (chunk.performanceMetrics) {
              lastMsg.performance = chunk.performanceMetrics;
            }
            newMsgs[newMsgs.length - 1] = lastMsg;
            return newMsgs;
          });
          break;
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Stream failed:", error);
        updateActiveConversationMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = {
            ...newMsgs[newMsgs.length - 1],
            content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
          };
          return newMsgs;
        });
      }
    } finally {
      setIsLoading(false);
      typingAudio.pause();
      if(generationSuccess) playSound(messageAudio);
      abortControllerRef.current = null;
      if (needsTitle && generationSuccess) {
          summarizeTitle(userInput).then(title => {
              handleRenameConversation(activeConversationId, title);
          });
      }
    }
  }, [activeConversationId, conversations, updateActiveConversationMessages, handleRenameConversation, typingAudio, messageAudio, playSound]);

   const handleNewChat = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: "Cuộc trò chuyện mới",
      messages: [],
    };
    setConversations(prev => ({ ...prev, [newId]: newConversation }));
    setActiveConversationId(newId);
    setIsLoading(false);
    setActiveTool(null);
    setIsSidebarOpen(false);
  };

  const handleClearChat = (id: string) => {
    setConversations(prev => ({
        ...prev,
        [id]: { ...prev[id], messages: [] }
    }));
    setIsConfirmDialogOpen(null);
    setActiveTool(null);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
        const newConversations = { ...prev };
        delete newConversations[id];
        return newConversations;
    });
    // If the active conversation is deleted, switch to another one or create a new one
    if (activeConversationId === id) {
        const remainingIds = Object.keys(conversations).filter(convoId => convoId !== id);
        if (remainingIds.length > 0) {
            setActiveConversationId(remainingIds[0]);
        } else {
            handleNewChat();
        }
    }
    setIsConfirmDialogOpen(null);
  };
  
  const handleFeedback = (messageIndex: number, feedback: 'positive' | 'negative') => {
    updateActiveConversationMessages(prev => {
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
    // If this is the first time setting a name, update the initial message
    if (activeConversation && activeConversation.messages.length === 1 && activeConversation.messages[0].content.includes('tôi có thể gọi bạn là gì?')) {
        updateActiveConversationMessages(() => [generateInitialMessage(profile)]);
    }
  };
  
  const handleForgetUser = () => {
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(ACTIVE_CONVERSATION_ID_KEY);
    setUserProfile(null);
    const newId = Date.now().toString();
    const initialConvo: Conversation = {
        id: newId,
        title: "Cuộc trò chuyện mới",
        messages: [generateInitialMessage(null)],
    };
    setConversations({ [newId]: initialConvo });
    setActiveConversationId(newId);
  };

  const handleSuggestionOrTool = (input: string, tool?: Task) => {
      if (tool) {
          setActiveTool(tool);
      } else {
          sendMessage(input);
      }
  };

  const currentMessages = activeConversation?.messages ?? [];

  return (
    <div className={`font-${font} flex h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300`}>
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
        
        <main className="flex flex-col flex-1 h-screen relative">
            <header className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0 z-10">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 md:hidden">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {activeConversation?.title || 'Trợ lý Kinh doanh'}
                    </h1>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsTestingGuideOpen(true)}
                        className="text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50"
                        title="Hướng dẫn kiểm thử"
                    >
                        <CheckBadgeIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsWorkflowDialogOpen(true)}
                        className="text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50"
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
                    />
                </div>
            </header>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                {currentMessages.length === 0 ? (
                    <Welcome onSuggestionClick={sendMessage} onToolSelect={setActiveTool} />
                ) : (
                    <ChatWindow 
                        messages={currentMessages}
                        isLoading={isLoading && !activeTool}
                        onSuggestionClick={sendMessage}
                        onFeedback={handleFeedback}
                    />
                )}

                <MessageInput 
                    onSendMessage={sendMessage}
                    isLoading={isLoading}
                    onNewChat={handleNewChat}
                    onClearChat={() => activeConversationId && setIsConfirmDialogOpen({ action: 'clear', id: activeConversationId })}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    onStopGeneration={handleStopGeneration}
                />
            </div>
        </main>

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

// Fix: Export the App component to be used in index.tsx
export default App;
