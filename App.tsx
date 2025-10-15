import React, { useState, useCallback, useEffect, useRef } from 'react';
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


const CONVERSATIONS_KEY = 'conversations';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId';
const THEME_KEY = 'theme';
const FONT_KEY = 'font';
const USER_PROFILE_KEY = 'userProfile';

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
  const [activeTool, setActiveTool] = useState<Task | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);


  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'system');
  const [font, setFont] = useState<Font>(() => (localStorage.getItem(FONT_KEY) as Font) || 'sans');
  
  const [osPrefersDark, setOsPrefersDark] = useState(() => 
      typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;

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

    const needsTitle = prevMessages.length === 0;
    
    updateActiveConversationMessages(prev => [...prev, { role: 'model', content: '' }]);
    
    abortControllerRef.current = new AbortController();

    try {
      const stream = getChatResponseStream(historyForApi, abortControllerRef.current.signal);
      let fullText = '';
      
      for await (const chunk of stream) {
        if (chunk.error) {
            throw new Error(chunk.error);
        }
        if (chunk.textChunk) {
            fullText += chunk.textChunk;
            updateActiveConversationMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1].content = fullText;
                }
                return newMessages;
            });
        }
        if (chunk.sources) {
             updateActiveConversationMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1].sources = chunk.sources;
                }
                return newMessages;
            });
        }
      }

      if (needsTitle && fullText) {
          summarizeTitle(userInput).then(title => {
              handleRenameConversation(activeConversationId, title);
          });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream generation aborted.');
        updateActiveConversationMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length-1].content.trim() === '') {
                return newMessages.slice(0,-2); // Remove user message and empty model message
            }
            if (newMessages.length > 0) {
                newMessages[newMessages.length-1].content += "\n\n*(Đã dừng)*";
            }
            return newMessages;
        });
      } else {
        console.error(error);
        const content = error.message || 'Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại sau.';
        updateActiveConversationMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = { role: 'model', content };
            }
            return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [activeConversationId, conversations, updateActiveConversationMessages, handleRenameConversation]);
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
        id: newId,
        title: "Cuộc trò chuyện mới",
        messages: [],
    };
    setConversations(prev => ({...prev, [newId]: newConversation }));
    setActiveConversationId(newId);
    setActiveTool(null);
    setIsSidebarOpen(false);
  };
  
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsSidebarOpen(false);
  };
  
  const handleDeleteConversation = (id: string) => {
    setIsConfirmDialogOpen({ action: 'delete', id });
  };
  
  const handleClearChat = () => {
    if (activeConversationId) {
        setIsConfirmDialogOpen({ action: 'clear', id: activeConversationId });
    }
  };

  const confirmAction = () => {
    if (!isConfirmDialogOpen) return;
    
    if (isConfirmDialogOpen.action === 'clear' && isConfirmDialogOpen.id) {
        updateActiveConversationMessages(() => []);
    }
    
    if (isConfirmDialogOpen.action === 'delete' && isConfirmDialogOpen.id) {
        const idToDelete = isConfirmDialogOpen.id;
        const remainingConversations = { ...conversations };
        delete remainingConversations[idToDelete];
        setConversations(remainingConversations);

        if (activeConversationId === idToDelete) {
            const remainingIds = Object.keys(remainingConversations);
            if (remainingIds.length > 0) {
                setActiveConversationId(remainingIds[0]);
            } else {
                handleNewChat();
            }
        }
    }
    
    setIsConfirmDialogOpen(null);
    setActiveTool(null);
  };
  
  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  };
  
  const handleForgetUser = () => {
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(ACTIVE_CONVERSATION_ID_KEY);
    setUserProfile(null);
    setConversations({});
    setActiveConversationId(null);
    handleNewChat(); // Start a fresh session
  };

  const handleFeedback = useCallback((messageIndex: number, feedback: 'positive' | 'negative') => {
    updateActiveConversationMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const messageToUpdate = newMessages[messageIndex];
        if (messageToUpdate && messageToUpdate.role === 'model') {
            newMessages[messageIndex] = { ...messageToUpdate, feedback };
        }
        return newMessages;
    });
    console.log(`Feedback for message ${messageIndex}: ${feedback}`);
  }, [updateActiveConversationMessages]);

  const fontClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  }[font];

  const isWelcomeState = activeConversation?.messages.length === 0;

  return (
    <div className={`h-screen w-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center ${fontClass}`}>
      <div className="w-full h-full md:h-[95vh] md:max-h-[900px] md:max-w-6xl bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-2xl flex border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Sidebar 
            conversations={Object.values(conversations)}
            activeConversationId={activeConversationId}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
        />
        <main className="flex-1 flex flex-col h-full transition-all duration-300">
            <header className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm flex items-center shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden text-slate-500 dark:text-slate-400 p-2 -ml-2"
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex-1">
                <h1 className="text-xl font-bold text-sky-600 dark:text-sky-400 tracking-wider text-center md:text-left md:ml-4 truncate">
                {activeConversation?.title || "Chatbot V64.VN"}
                </h1>
            </div>
            <div className="flex justify-end">
                <SettingsPopover 
                    theme={theme} 
                    setTheme={setTheme} 
                    font={font} 
                    setFont={setFont}
                    userProfile={userProfile}
                    onUpdateProfile={handleUpdateProfile}
                    onForgetUser={handleForgetUser}
                />
            </div>
            </header>
            
            {isWelcomeState ? (
                <Welcome onSuggestionClick={handleSuggestionClick} onToolSelect={setActiveTool} />
            ) : (
                <ChatWindow 
                    messages={activeConversation?.messages || []} 
                    isLoading={isLoading} 
                    onSuggestionClick={handleSuggestionClick}
                    onFeedback={handleFeedback}
                />
            )}

            <MessageInput 
                onSendMessage={sendMessage} 
                isLoading={isLoading}
                onNewChat={handleNewChat}
                onClearChat={handleClearChat}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                onStopGeneration={handleStopGeneration}
            />
        </main>
      </div>
      <ConfirmationDialog 
          isOpen={!!isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(null)}
          onConfirm={confirmAction}
          title={isConfirmDialogOpen?.action === 'clear' ? "Xác nhận Xóa Tin nhắn" : "Xác nhận Xóa Cuộc trò chuyện"}
          message={isConfirmDialogOpen?.action === 'clear' ? "Bạn có chắc chắn muốn xóa tất cả tin nhắn trong cuộc trò chuyện này không?" : "Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này không?"}
      />
    </div>
  );
};

export default App;
