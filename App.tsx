import React, { useState, useCallback, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { getChatResponse } from './services/geminiService';
import type { ChatMessage, UserProfile, Theme, Font } from './types';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import type { Task } from './components/GuidedInputForm';
import { SettingsPopover } from './components/SettingsPopover';
import { WorkflowInfo } from './components/WorkflowInfo';

const CHAT_HISTORY_KEY = 'chatHistory';
const THEME_KEY = 'theme';
const FONT_KEY = 'font';
const USER_PROFILE_KEY = 'userProfile';

type ImageData = ChatMessage['image'];

const generateInitialMessage = (profile: UserProfile | null, theme: 'light' | 'dark', font: Font): ChatMessage => {
  if (profile) {
    const themeText = theme === 'light' ? 'Sáng' : 'Tối';
    const fontText = { sans: 'Mặc định', serif: 'Serif', mono: 'Mono' }[font];

    return {
      role: 'model',
      content: `Chào mừng trở lại, ${profile.name}! Cài đặt giao diện của bạn (Chủ đề: ${themeText}, Phông chữ: ${fontText}) đã được tải. Tôi có thể giúp gì cho bạn hôm nay?`,
      suggestions: [
        'V64 cung cấp giải pháp gì?',
        'Các dự án tiêu biểu của V64',
        'Làm thế nào để liên hệ V64?',
      ],
    };
  }
  return {
    role: 'model',
    content: 'Xin chào! Tôi là trợ lý ảo của V64. Để cá nhân hóa trải nghiệm, tôi có thể gọi bạn là gì?',
  };
};


const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Task | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'system');
  const [font, setFont] = useState<Font>(() => (localStorage.getItem(FONT_KEY) as Font) || 'sans');
  
  // State to track OS theme preference
  const [osPrefersDark, setOsPrefersDark] = useState(() => 
      typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  // Listen for changes in OS preference
  useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setOsPrefersDark(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Calculate the effective theme to be applied ('light' or 'dark')
  const effectiveTheme = theme === 'system' ? (osPrefersDark ? 'dark' : 'light') : theme;

  // Apply the theme to the DOM and save user's choice ('light', 'dark', or 'system')
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

      const savedHistory = window.localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        setMessages(JSON.parse(savedHistory));
      } else {
        const initialFont = (localStorage.getItem(FONT_KEY) as Font) || 'sans';
        const storedThemeChoice = (localStorage.getItem(THEME_KEY) as Theme) || 'system';
        const osPrefersDarkNow = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialEffectiveTheme = storedThemeChoice === 'system' ? (osPrefersDarkNow ? 'dark' : 'light') : storedThemeChoice;
        setMessages([generateInitialMessage(profile, initialEffectiveTheme, initialFont)]);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      const initialFont = (localStorage.getItem(FONT_KEY) as Font) || 'sans';
      const storedThemeChoice = (localStorage.getItem(THEME_KEY) as Theme) || 'system';
      const osPrefersDarkNow = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialEffectiveTheme = storedThemeChoice === 'system' ? (osPrefersDarkNow ? 'dark' : 'light') : storedThemeChoice;
      setMessages([generateInitialMessage(null, initialEffectiveTheme, initialFont)]);
    }
  }, []);

  useEffect(() => {
    try {
      if (messages.length > 0) {
        window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages, (key, value) => {
            if (key === 'component') return undefined;
            return value;
        }));
      }
    } catch (error) {
      console.error('Failed to save chat history to localStorage:', error);
    }
  }, [messages]);

  const sendMessage = useCallback(async (userInput: string, image?: ImageData) => {
    if (!userProfile) {
      const trimmedName = userInput.trim();
      if (!trimmedName) return;

      const newProfile: UserProfile = { name: trimmedName };
      setUserProfile(newProfile);
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));

      const userMessage: ChatMessage = { role: 'user', content: userInput };
      const welcomeMessage: ChatMessage = {
          role: 'model',
          content: `Rất vui được gặp bạn, ${newProfile.name}! Dưới đây là các quy trình làm việc bạn có thể tham khảo. Tôi có thể giúp gì cho bạn?`,
          component: <WorkflowInfo />,
          suggestions: [
              'V64 cung cấp giải pháp gì?',
              'Các dự án tiêu biểu của V64',
              'Làm thế nào để liên hệ V64?',
          ],
      };
      setMessages([userMessage, welcomeMessage]);
      return;
    }

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
      const { text, sources, image } = await getChatResponse(newHistory);
      const modelMessage: ChatMessage = { role: 'model', content: text, sources, image };
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
  }, [messages, userProfile]);
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  const handleNewChat = () => {
    setMessages([generateInitialMessage(userProfile, effectiveTheme, font)]);
    setActiveTool(null);
  };

  const handleClearChat = () => {
    setIsConfirmDialogOpen(true);
  };

  const confirmClearChat = () => {
    setMessages([generateInitialMessage(userProfile, effectiveTheme, font)]);
    window.localStorage.removeItem(CHAT_HISTORY_KEY);
    setIsConfirmDialogOpen(false);
    setActiveTool(null);
  };
  
  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  };
  
  const handleForgetUser = () => {
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    setUserProfile(null);
    setMessages([generateInitialMessage(null, effectiveTheme, font)]);
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