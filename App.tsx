import React, { useState, useCallback, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { getChatResponse } from './services/geminiService';
import type { ChatMessage } from './types';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import type { Task } from './components/GuidedInputForm';
import { SettingsPopover } from './components/SettingsPopover';

const CHAT_HISTORY_KEY = 'chatHistory';
const THEME_KEY = 'theme';
const FONT_KEY = 'font';

type Theme = 'light' | 'dark';
type Font = 'sans' | 'serif' | 'mono';
type ImageData = ChatMessage['image'];

const INITIAL_MESSAGE: ChatMessage = {
  role: 'model',
  content: 'Xin chào! Tôi là trợ lý ảo của V64. Tôi có thể trả lời các câu hỏi về công ty, giải pháp và các dự án của chúng tôi. Bạn muốn biết về điều gì?',
  suggestions: [
    'V64 cung cấp giải pháp gì?',
    'Các dự án tiêu biểu của V64',
    'Làm thế nào để liên hệ V64?',
  ],
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = window.localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsedMessages = JSON.parse(saved);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          return parsedMessages;
        }
      }
    } catch (error) {
      console.error('Failed to load chat history from localStorage:', error);
    }
    return [INITIAL_MESSAGE];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Task | null>(null);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [font, setFont] = useState<Font>(() => (localStorage.getItem(FONT_KEY) as Font) || 'sans');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  
  useEffect(() => {
    localStorage.setItem(FONT_KEY, font);
  }, [font]);


  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error)
 {
      console.error('Failed to save chat history to localStorage:', error);
    }
  }, [messages]);

  const sendMessage = useCallback(async (userInput: string, image?: ImageData) => {
    const userMessage: ChatMessage = { role: 'user', content: userInput, image };
    
    const historyWithClearedSuggestions = messages.map((msg, index) => {
        if (index === messages.length - 1) {
            const { suggestions, ...rest } = msg;
            return rest;
        }
        return msg;
    });

    const newHistory: ChatMessage[] = [...historyWithClearedSuggestions, userMessage];
    setMessages(newHistory);
    setIsLoading(true);
    setActiveTool(null);
    
    try {
      const { text, sources } = await getChatResponse(newHistory);
      const modelMessage: ChatMessage = { role: 'model', content: text, sources };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: 'Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại sau.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  const handleNewChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setActiveTool(null);
  };

  const handleClearChat = () => {
    setIsConfirmDialogOpen(true);
  };

  const confirmClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    window.localStorage.removeItem(CHAT_HISTORY_KEY);
    setIsConfirmDialogOpen(false);
    setActiveTool(null);
  };
  
  const fontClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  }[font];

  return (
    <div className={`h-screen w-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center ${fontClass}`}>
      <div className="w-full max-w-4xl h-full md:h-[90vh] md:max-h-[800px] bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700">
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm flex items-center">
          <div className="flex-1">
            {/* Left aligned content can go here */}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-sky-600 dark:text-sky-400 tracking-wider text-center">
              Chatbot V64.VN
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            <SettingsPopover theme={theme} setTheme={setTheme} font={font} setFont={setFont} />
          </div>
        </header>
        <ChatWindow messages={messages} isLoading={isLoading} onSuggestionClick={handleSuggestionClick} />
        <MessageInput 
            onSendMessage={sendMessage} 
            isLoading={isLoading}
            onNewChat={handleNewChat}
            onClearChat={handleClearChat}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
        />
      </div>
       <footer className="text-center text-xs text-slate-600 dark:text-slate-500 mt-2 pb-2">
            Powered by Gemini API
        </footer>
        <ConfirmationDialog 
            isOpen={isConfirmDialogOpen}
            onClose={() => setIsConfirmDialogOpen(false)}
            onConfirm={confirmClearChat}
            title="Xác nhận Xóa Lịch sử"
            message="Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này không? Hành động này không thể hoàn tác."
        />
    </div>
  );
};

export default App;
