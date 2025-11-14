// NOTE FOR DEVELOPER:
// This application runs entirely in the browser and connects directly to the Google Gemini API.
// To make it work, ensure the Gemini API key is correctly configured in your environment.

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect
} from "react";
import { ChatWindow } from "./components/ChatWindow";
import { MessageInput } from "./components/MessageInput";
import { getChatResponseStream, createFineTuningExampleFromCorrection, findImageFromSearchQuery, translateText } from "./services/geminiService";
import * as apiService from "./services/apiService";
import * as businessService from "./services/businessService";
import type {
  ChatMessage,
  UserProfile,
  Theme,
  Font,
  ConversationMeta,
  Task,
  ConversationGroup,
  BusinessProfile,
  FineTuningExample,
  Feedback,
  AnalysisResult,
} from "./types";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import { SettingsPopover } from "./components/SettingsPopover";
import { Welcome } from "./components/Welcome";
import { Sidebar } from "./components/Sidebar";
import { WorkflowDialog } from "./components/WorkflowDialog";
import { TestingGuideDialog } from "./components/TestingGuideDialog";
import { ComparisonToolbar } from "./components/ComparisonToolbar";
import { SourceComparisonDialog } from "./components/SourceComparisonDialog";
import { ExportDialog } from "./components/ExportDialog";
import { BusinessProfileDialog } from "./components/BusinessProfileDialog";
import { FeedbackDialog } from "./components/FeedbackDialog";
import { MenuIcon } from "./components/icons/MenuIcon";
import { MagnifyingGlassIcon } from "./components/icons/MagnifyingGlassIcon";
import { typingSound } from "./assets/typingSound";
import { messageReceivedSound } from "./assets/messageReceivedSound";
import { toPng } from "html-to-image";
import { AnalysisChart } from "./components/charts/AnalysisChart";
import { SourceFilterControl } from "./components/SourceFilterControl";
import { FindBar } from "./components/FindBar";
import { ProductCatalog } from "./components/ProductCatalog";
import { BrandPositioningMap } from "./components/BrandPositioningMap";
import { MarketResearchReport } from "./components/MarketResearchReport";
import { BriefcaseIcon } from "./components/icons/BriefcaseIcon";
import { PowerBIReport } from "./components/PowerBIReport";
import { GuidedTour, TourStep } from "./components/GuidedTour";


/* ===========================================================
   ================= CONSTANTS & CONFIG ======================
   =========================================================== */
const THEME_KEY = "theme";
const FONT_KEY = "font";
const SOUND_ENABLED_KEY = "soundEnabled";
const ACTIVE_CONVERSATION_ID_KEY = "activeConversationId";

const tourSteps: TourStep[] = [
    {
        elementId: 'tour-step-1-new-chat',
        title: 'Bắt đầu Hội thoại mới',
        description: 'Nhấn vào đây để bắt đầu một cuộc trò chuyện mới bất cứ lúc nào.',
        position: 'right',
    },
    {
        elementId: 'tour-step-2-convo-list',
        title: 'Quản lý các Hội thoại',
        description: 'Tất cả các cuộc trò chuyện của bạn sẽ được lưu ở đây. Bạn có thể đổi tên, xóa, hoặc kéo-thả để sắp xếp chúng vào các nhóm.',
        position: 'right',
    },
    {
        elementId: 'tour-step-3-view-switcher',
        title: 'Chuyển đổi Chế độ xem',
        description: 'Chuyển đổi giữa giao diện Trò chuyện, quản lý Sản phẩm, hoặc xem Báo cáo Power BI.',
        position: 'right',
    },
    {
        elementId: 'tour-step-4-message-input',
        title: 'Gửi Yêu cầu của bạn',
        description: 'Đây là nơi bạn nhập câu hỏi, đính kèm hình ảnh hoặc ghi âm giọng nói để tương tác với AI.',
        position: 'top',
    },
    {
        elementId: 'tour-step-5-tools-button',
        title: 'Các Công cụ Phân tích',
        description: 'Mở menu các công cụ phân tích chuyên sâu như Lợi nhuận, Khuyến mãi, hoặc Nghiên cứu Xu hướng.',
        position: 'top',
    },
    {
        elementId: 'tour-step-6-settings-button',
        title: 'Cài đặt & Tùy chỉnh',
        description: 'Thay đổi giao diện, quản lý hồ sơ kinh doanh và truy cập các hướng dẫn tại đây.',
        position: 'left',
    },
];

const taskTitles: Record<Task, string> = {
  'profit-analysis': 'Phân tích Lợi nhuận & Lập kế hoạch Kinh doanh',
  'promo-price': 'Phân tích & Dự báo Hiệu quả Khuyến mãi',
  'group-price': 'Phân tích Chiến dịch Đồng giá',
  'market-research': 'Nghiên cứu Xu hướng & Lên ý tưởng Bộ sưu tập',
  'brand-positioning': 'Định vị Thương hiệu'
};

const detectFallbackTask = (prompt: string): Task | null => {
    if (!prompt) return null;
    const p = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (p.includes('loi nhuan')) return 'profit-analysis';
    if (p.includes('khuyen mai')) return 'promo-price';
    if (p.includes('dong gia')) return 'group-price';
    return null;
};


const toNum = (v: any): number => {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/[^\d-]/g, ''); // Keep only digits and minus sign
  if (s === '') return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

const sanitizeChartData = (charts: any[]): any[] => {
    if (!charts || !Array.isArray(charts)) return [];

    return charts.map(chart => {
        if (!chart.data || !Array.isArray(chart.data) || chart.data.length === 0) {
            return chart;
        }

        // Find the data key (the one that's not 'name')
        const dataKey = Object.keys(chart.data[0] || {}).find(key => key !== 'name');
        if (!dataKey) return chart;

        const sanitizedData = chart.data.map(point => {
            if (point && point[dataKey] !== undefined) {
                const numericValue = toNum(point[dataKey]);
                return { ...point, [dataKey]: numericValue };
            }
            return point;
        });

        return { ...chart, data: sanitizedData };
    });
};


const playSound = (audio: HTMLAudioElement, enabled: boolean) => {
  if (!enabled) return;
  try {
    const clone = audio.cloneNode(true) as HTMLAudioElement;
    clone.volume = audio.volume;
    clone.currentTime = 0;
    clone.play().catch(() => {});
  } catch {}
};

const buildAnalysisPrompt = (task: Task, params: Record<string, any>): string => {
  if (task === 'market-research') {
        const competitors = Array.isArray(params.competitors) ? params.competitors.join(', ') : params.competitors || 'None';
        const useSearch = competitors && competitors.length > 0;
        return `REQUIRED OUTPUT FORMAT: JSON. You are a world-class Fashion Trend Analyst. Conduct a detailed fashion trend report based on the criteria below. The report MUST focus specifically on **denim trends**. ${useSearch ? 'Use Google Search extensively to gather real-time, relevant information from top industry sources like WGSN, Vogue Runway, Sourcing Journal, WWD, Tagwalk, and Business of Fashion to identify these denim trends.' : ''} The analysis must be structured like a professional presentation for a fashion brand's product development team.

IMPORTANT: All text content MUST be in English.

**IMAGE INSPIRATION SOURCE:** For the 'key_items', you MUST find inspiration from the major Fashion Weeks: Milan, London, Paris, New York, Seoul, and Shanghai. Do NOT use competitor brands as the primary inspiration source for images.

CRITERIA:
- Season: ${params.season} ${params.year}
- Style Keywords: ${params.style_keywords}
- Target Audience: ${params.target_audience}
- Reference Markets: ${params.markets.join(', ')}
- Competitors for Context: ${competitors}

The JSON output MUST follow this exact structure:
{
  "trend_sections": [
    {
      "title": "1. Trend Core – [Name of Trend 1]",
      "description": "- [Key characteristic 1 in ENGLISH]\\n- [Key characteristic 2 in ENGLISH]",
      "key_items": [
        { "inspiration_source": "Milan Fashion Week", "image_search_query": "[Concise ENGLISH prompt for an AI image generation model to create a realistic fashion photo]" },
        { "inspiration_source": "Paris Fashion Week", "image_search_query": "[...]" },
        { "inspiration_source": "New York Fashion Week", "image_search_query": "[...]" },
        { "inspiration_source": "London Fashion Week", "image_search_query": "[...]" },
        { "inspiration_source": "Seoul Fashion Week", "image_search_query": "[...]" },
        { "inspiration_source": "Shanghai Fashion Week", "image_search_query": "[...]" }
      ]
    }
  ],
  "wash_effect_summary": {
    "title": "4. Washing Effect – Hiệu ứng wash",
    "table": [
      { "wash_type": "[Name of Wash 1]", "application_effect": "[Description in ENGLISH]" },
      { "wash_type": "[Name of Wash 2]", "application_effect": "[...]" }
    ]
  }
}
For 'image_search_query', create a concise, effective prompt for an AI image generation model to create a high-quality, realistic fashion photo. The prompt should describe the item, the style, and the context, referencing the specified Fashion Week. Example: "Street style photo from Paris Fashion Week FW24, a model wearing oversized, dark-wash denim jacket with exaggerated shoulders, cinematic lighting".
`;
  }
    
  const intro = `REQUIRED OUTPUT FORMAT: JSON
TASK: Perform a business analysis based on the following data.
Analyze the data and provide a summary, a detailed analysis, and chart data.

**IMPORTANT RULES:**
1. All textual output ('summary', 'analysis', chart 'title', and data 'name' keys) MUST be in **English**.
2. The JSON output must contain three keys: "summary" (string), "analysis" (string), and "charts" (array of objects).
3. The "charts" key is REQUIRED. If no charts are applicable, return an empty array: "charts": [].
4. The "summary" string MUST be a concise summary in English, with important numbers formatted in bold Markdown (e.g., **1,234,567 VND**).
5. The "analysis" and "summary" strings must escape newlines as \\n.
6. Each object within the "data" array MUST have a "name" key (an English string for the X-axis label) and a "value" key (a raw number for the Y-axis value, not a string). Example: { "name": "Revenue", "value": 307750000 }.
---
`;

  let dataSection = `DATA:\n`;
  switch (task) {
    case 'profit-analysis':
      dataSection += `Analysis Type: Profitability and Business Planning\n`;
      dataSection += `Product Name: ${params.productName}\n`;
      dataSection += `Unit Cost: ${params.cost} VND\n`;
      dataSection += `Unit Variable Cost: ${params.variableCost} VND\n`;
      dataSection += `Total Fixed Cost (${params.period}): ${params.fixedCost} VND\n`;
      dataSection += `Target Calculation: ${params.calculationTarget}\n`;
      if (params.calculationTarget !== 'sellingPrice') dataSection += `Unit Selling Price: ${params.sellingPrice} VND\n`;
      if (params.calculationTarget !== 'salesVolume') dataSection += `Expected Sales Volume (${params.period}): ${params.salesVolume} units\n`;
      if (params.calculationTarget !== 'profit') {
        if (params.profitTargetType === 'amount') {
          dataSection += `Target Profit (${params.period}): ${params.targetProfit} VND\n`;
        } else {
          dataSection += `Target Profit Margin: ${params.targetProfitPercent}%\n`;
        }
      }
      if (params.competitors && params.competitors.length > 0) dataSection += `Competitors for market comparison: ${params.competitors.join(', ')}. Use Google Search to get their market prices.`;
      break;
    case 'promo-price':
       dataSection += `Analysis Type: Promotion Effectiveness Forecast\n`;
       dataSection += `Product Name: ${params.productName}\n`;
       dataSection += `Original Selling Price: ${params.originalPrice} VND\n`;
       dataSection += `Unit Cost: ${params.cost} VND\n`;
       dataSection += `Current Sales Volume (monthly): ${params.currentSales} units\n`;
       dataSection += `Proposed Discount Rate: ${params.discount}%\n`;
       dataSection += `Campaign Goal: ${params.promoGoal === 'profit' ? 'Maximize Profit' : 'Maximize Revenue'}\n`;
       if (params.competitors && params.competitors.length > 0) dataSection += `Competitors for market comparison: ${params.competitors.join(', ')}. Use Google Search to get their market prices.`;
       break;
    case 'group-price':
        dataSection += `Analysis Type: Flat-Price Campaign Analysis\n`;
        dataSection += `Target Flat Price: ${params.flatPrice} VND\n`;
        dataSection += `Expected Sales Growth per Product: ${params.salesIncrease}%\n`;
        dataSection += `Products in Campaign:\n`;
        params.products.forEach((p: any) => {
            dataSection += `- Name: ${p.name}, Original Price: ${p.originalPrice} VND, Unit Cost: ${p.cost} VND, Current Sales (monthly): ${p.currentSales} units\n`;
        });
        if (params.competitors && params.competitors.length > 0) dataSection += `Competitors for market comparison: ${params.competitors.join(', ')}. Use Google Search to get their market prices.`;
        break;
    default:
      return JSON.stringify(params);
  }

  return intro + dataSection;
};

const processMessagesWithComponents = (messages: ChatMessage[], effectiveTheme: 'light' | 'dark'): ChatMessage[] => {
    return messages.map(msg => {
        if (msg.role === 'model' && !msg.component) {
            if (msg.task === 'brand-positioning') {
                return { ...msg, component: <BrandPositioningMap /> };
            }
            if (msg.marketResearchData) {
                return { ...msg, component: <MarketResearchReport data={msg.marketResearchData} theme={effectiveTheme} /> };
            }
            if (msg.charts && msg.charts.length > 0) {
                 return { ...msg, charts: msg.charts.map(c => ({...c, component: AnalysisChart})) };
            }
        }
        return msg;
    });
};

/* ===========================================================
   =================== MAIN APP COMPONENT ====================
   =========================================================== */
const App: React.FC = () => {
  /* ===================== STATE MANAGEMENT ===================== */
  // --- Core State ---
  const [conversations, setConversations] = useState<Record<string, ConversationMeta>>({});
  const [conversationGroups, setConversationGroups] = useState<Record<string, ConversationGroup>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationMessages, setActiveConversationMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<{ task: Task; initialData?: any; } | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'products' | 'report'>('chat');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [input, setInput] = useState('');

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [font, setFont] = useState<Font>('sans');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [fineTuningExamples, setFineTuningExamples] = useState<FineTuningExample[]>([]);
  const [shouldFocusInput, setShouldFocusInput] = useState(false);
  
  // --- Dialogs & Popovers ---
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isTestingGuideOpen, setIsTestingGuideOpen] = useState(false);
  const [isBusinessProfileOpen, setIsBusinessProfileOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFindBarVisible, setIsFindBarVisible] = useState(false);
  const [feedbackDialogState, setFeedbackDialogState] = useState<{isOpen: boolean; message: ChatMessage | null; index: number | null}>({isOpen: false, message: null, index: null});
  const [comparisonSelection, setComparisonSelection] = useState<number[]>([]);
  const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'convo' | 'group', id: string } | null>(null);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);

  // --- Refs ---
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const typingAudio = useMemo(() => new Audio(typingSound), []);
  const messageAudio = useMemo(() => new Audio(messageReceivedSound), []);
  typingAudio.volume = 0.5;
  messageAudio.volume = 0.7;

  /* ===================== EFFECTS (LIFECYCLE) ===================== */
  // --- Initial Data Load ---
  useEffect(() => {
    // Check if onboarding prompt has been seen in this session
    const hasSeenPrompt = sessionStorage.getItem('v64_onboarding_prompt_seen');
    if (!hasSeenPrompt) {
        // Use a timeout to avoid showing the prompt immediately on load
        const timer = setTimeout(() => {
            setShowOnboardingPrompt(true);
        }, 1500); // 1.5-second delay
        return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      const [profile, convos, groups, busProfile, ftExamples] = await Promise.all([
        apiService.loadUserProfile(),
        apiService.loadConversations(),
        apiService.loadConversationGroups(),
        apiService.loadBusinessProfile(),
        apiService.loadFineTuningExamples(),
      ]);
      setUserProfile(profile);
      setConversations(convos);
      setConversationGroups(groups);
      setBusinessProfile(busProfile);
      setFineTuningExamples(ftExamples);

      const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      const savedFont = localStorage.getItem(FONT_KEY) as Font | null;
      const savedSound = localStorage.getItem(SOUND_ENABLED_KEY);
      if (savedTheme) setTheme(savedTheme);
      if (savedFont) setFont(savedFont);
      if (savedSound) setSoundEnabled(JSON.parse(savedSound));

      const lastActiveId = localStorage.getItem(ACTIVE_CONVERSATION_ID_KEY);
      if (lastActiveId && convos[lastActiveId]) {
        setActiveConversationId(lastActiveId);
      } else if (Object.keys(convos).length > 0) {
        setActiveConversationId(Object.keys(convos)[0]);
      } else {
        handleNewChat();
      }
    };
    loadInitialData();
  }, []);

  // --- Theme & Font Management ---
  const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveTheme = theme === 'system' ? (osPrefersDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(effectiveTheme);
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
  
  // --- Active Conversation Management ---
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_CONVERSATION_ID_KEY, activeConversationId);
      setIsLoading(true);
      apiService.loadMessages(activeConversationId).then(messages => {
        const processedMessages = processMessagesWithComponents(messages, effectiveTheme);
        setActiveConversationMessages(processedMessages);
        setIsLoading(false);
      });
    }
  }, [activeConversationId, effectiveTheme]);

  // --- Auto-save Messages ---
  useEffect(() => {
    if (activeConversationId && activeConversationMessages.length > 0) {
      apiService.saveMessages(activeConversationId, activeConversationMessages);
    }
  }, [activeConversationId, activeConversationMessages]);
  
  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsFindBarVisible(v => !v);
      }
      if (e.key === 'Escape') {
        setIsFindBarVisible(false);
        setEditingMessageId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ===================== DATA & COMPUTED VALUES ===================== */
  const allSources = useMemo(() => {
      const sources = new Map<string, { uri: string; title: string }>();
      activeConversationMessages.forEach(msg => {
          if (msg.role === 'model' && msg.sources) {
              msg.sources.forEach(source => {
                  if (!sources.has(source.uri)) {
                      sources.set(source.uri, source);
                  }
              });
          }
      });
      return Array.from(sources.values());
  }, [activeConversationMessages]);
  
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  
  const filteredMessages = useMemo(() => {
      if (!sourceFilter) return activeConversationMessages;
      const filtered: ChatMessage[] = [];
      for(let i = 0; i < activeConversationMessages.length; i++) {
          const msg = activeConversationMessages[i];
          if(msg.role === 'model' && msg.sources?.some(s => s.uri === sourceFilter)) {
              for(let j = i - 1; j >= 0; j--) {
                  const prevMsg = activeConversationMessages[j];
                  if(prevMsg.role === 'user') {
                      if(!filtered.includes(prevMsg)) {
                          filtered.push(prevMsg);
                      }
                      break; 
                  }
              }
              filtered.push(msg);
          }
      }
      return filtered;
  }, [activeConversationMessages, sourceFilter]);

  /* ===================== CALLBACKS & HANDLERS ===================== */
  const handleConfirmOnboarding = useCallback(() => {
    setShowOnboardingPrompt(false);
    setShowGuidedTour(true);
    sessionStorage.setItem('v64_onboarding_prompt_seen', 'true');
  }, []);

  const handleDeclineOnboarding = useCallback(() => {
      setShowOnboardingPrompt(false);
      sessionStorage.setItem('v64_onboarding_prompt_seen', 'true');
  }, []);
  
  // --- Conversation Management ---
  const handleNewChat = useCallback(async () => {
    const newConvo = await apiService.createNewConversation();
    if (newConvo) {
      setConversations(prev => ({ ...prev, [newConvo.id]: newConvo }));
      setActiveConversationId(newConvo.id);
      setActiveView('chat');
    }
  }, []);

  const handleSelectConversation = (id: string) => {
    if (id !== activeConversationId) {
      setComparisonSelection([]);
      setSourceFilter(null);
    }
    setActiveConversationId(id);
    setActiveView('chat');
  };
  
  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setConversations(prev => ({...prev, [id]: { ...prev[id], title: newTitle.trim() }}));
    await apiService.saveConversationMeta(id, { title: newTitle.trim() });
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    if (Object.keys(conversations).length <= 1) return; 
    
    setConversations(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });

    if (activeConversationId === id) {
      const remainingIds = Object.keys(conversations).filter(cid => cid !== id);
      setActiveConversationId(remainingIds[0] || null);
    }
    
    await apiService.deleteConversation(id);
  }, [conversations, activeConversationId]);
  
  const handleClearChat = () => {
    if (activeConversationId) {
        setActiveConversationMessages([]);
        apiService.clearConversationMessages(activeConversationId);
    }
  };

  // --- Group Management ---
  const handleCreateGroup = useCallback(async (name: string) => {
    const newGroup = await apiService.createConversationGroup(name);
    if(newGroup) {
      setConversationGroups(prev => ({...prev, [newGroup.id]: newGroup}));
    }
  }, []);

  const handleRenameGroup = useCallback(async (id: string, newName: string) => {
    setConversationGroups(prev => ({...prev, [id]: {...prev[id], name: newName}}));
    await apiService.renameConversationGroup(id, newName);
  }, []);

  const handleDeleteGroup = useCallback(async (id: string) => {
    setConversationGroups(prev => {
      const newState = {...prev};
      delete newState[id];
      return newState;
    });
    setConversations(prev => {
      const newState = {...prev};
      Object.keys(newState).forEach(convoId => {
        if (newState[convoId].groupId === id) {
          newState[convoId].groupId = null;
        }
      });
      return newState;
    });
    await apiService.deleteConversationGroup(id);
  }, []);

  const handleAssignConversationToGroup = useCallback(async (conversationId: string, groupId: string | null) => {
    setConversations(prev => ({ ...prev, [conversationId]: { ...prev[conversationId], groupId }}));
    await apiService.assignConversationToGroup(conversationId, groupId);
  }, []);

  // --- Chat Interaction ---
  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (userInput: string, image?: { file: File; dataUrl: string }, analysisPayload?: { params: Record<string, any>; task: Task }) => {
      if (isLoading) return;

      let finalPrompt = userInput;
      let userMessage: ChatMessage = { role: 'user', content: userInput };

      if (image) userMessage.image = image.dataUrl;
      
      const isAnalysis = !!analysisPayload;

      if(analysisPayload) {
        userMessage.analysisParams = analysisPayload.params;
        userMessage.task = analysisPayload.task;
        finalPrompt = buildAnalysisPrompt(analysisPayload.task, analysisPayload.params);
        userMessage.rawPrompt = finalPrompt;
        // Don't translate analysis prompts as they are already built in English
      } else {
        const englishPrompt = await translateText(userInput, 'vi', 'en');
        if (englishPrompt && englishPrompt.toLowerCase() !== userInput.toLowerCase()) {
            finalPrompt = englishPrompt;
            userMessage.isTranslated = true;
            userMessage.originalContent = userInput;
        }
      }
      
      const updatedMessages = [...activeConversationMessages, userMessage];
      setActiveConversationMessages(updatedMessages);
      setIsLoading(true);

      const modelResponse: ChatMessage = { role: 'model', content: '' };
      setActiveConversationMessages(prev => [...prev, modelResponse]);
      
      if (analysisPayload?.task === 'brand-positioning') {
          setActiveConversationMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === 'model') {
                lastMsg.content = `Đang tạo sơ đồ định vị thương hiệu...`;
                lastMsg.component = <BrandPositioningMap />;
                lastMsg.task = 'brand-positioning';
              }
              return newMessages;
          });
          setIsLoading(false);
          playSound(messageAudio, soundEnabled);
          return;
      }
      
      const userMessageForHistory = {...userMessage, content: finalPrompt, rawPrompt: finalPrompt};

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      try {
        const stream = getChatResponseStream(
            [...updatedMessages.slice(0, -1), userMessageForHistory],
            signal,
            { task: analysisPayload?.task, useCreativePersona: analysisPayload?.task === 'market-research' }
        );

        let accumulatedText = '';
        let isFirstChunk = true;

        for await (const chunk of stream) {
          if (signal.aborted) break;

          if (isFirstChunk) {
            playSound(typingAudio, soundEnabled);
            isFirstChunk = false;
          }

          if (chunk.textChunk) {
            accumulatedText += chunk.textChunk;

            setActiveConversationMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === 'model') {
                lastMsg.content = accumulatedText;
              }
              return newMessages;
            });
          }

          if (chunk.isFinal) {
            playSound(messageAudio, soundEnabled);
            
            const originalEnglishResponse = accumulatedText;
            
            const suggestionRegex = /\[SUGGESTION\](.*?)\[\/SUGGESTION\]/g;
            const englishSuggestions: string[] = [];
            originalEnglishResponse.replace(suggestionRegex, (match, suggestionText) => {
                if (suggestionText) englishSuggestions.push(suggestionText.trim());
                return '';
            });
            
            const translatedSuggestions = await Promise.all(
                englishSuggestions.map(s => translateText(s, 'en', 'vi'))
            );
            const finalSuggestions = translatedSuggestions.filter((s): s is string => !!s);

            let finalMessage: ChatMessage = {
                role: 'model',
                content: '',
                sources: chunk.sources,
                performance: chunk.performanceMetrics,
                analysisParams: analysisPayload?.params,
                task: analysisPayload?.task,
                suggestions: finalSuggestions.length > 0 ? finalSuggestions : undefined,
                isTranslated: false,
                originalContent: originalEnglishResponse.replace(suggestionRegex, '').trim(),
            };
            
            let isJsonAnalysis = false;
            let stateSetForMarketResearch = false;

            try {
                const containsJson = originalEnglishResponse.includes('{') && originalEnglishResponse.includes('}');
                if (finalMessage.role === 'model' && finalMessage.task && containsJson) {
                    isJsonAnalysis = true;
                    let jsonString = originalEnglishResponse;
                    const jsonBlockMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
                    if (jsonBlockMatch && jsonBlockMatch[1]) {
                        jsonString = jsonBlockMatch[1];
                    } else {
                        const firstBrace = jsonString.indexOf('{');
                        const lastBrace = jsonString.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace > firstBrace) {
                            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
                        } else {
                            throw new Error("Valid JSON object not found in the AI response.");
                        }
                    }

                    if(finalMessage.task === 'market-research') {
                        stateSetForMarketResearch = true;
                        const marketData = JSON.parse(jsonString);

                        const fetchImagesAndUpdateState = async (data: any) => {
                            const updatedData = JSON.parse(JSON.stringify(data));
                            if (updatedData.trend_sections) {
                                await Promise.all(updatedData.trend_sections.flatMap((section: any) =>
                                    section.key_items?.map(async (item: any) => {
                                        if (item.image_search_query) {
                                            item.image_urls = await findImageFromSearchQuery(item.image_search_query);
                                        }
                                    }) || []
                                ));
                            }
                            setActiveConversationMessages(prev => {
                                const newMessages = [...prev];
                                const lastMessage = newMessages[newMessages.length - 1];
                                if (lastMessage?.role === 'model' && lastMessage.task === 'market-research') {
                                    newMessages[newMessages.length - 1] = {
                                        ...lastMessage,
                                        marketResearchData: updatedData,
                                        component: <MarketResearchReport data={updatedData} theme={effectiveTheme} />,
                                    };
                                    return newMessages;
                                }
                                return prev;
                            });
                        };

                        if (marketData.trend_sections) {
                            await Promise.all(marketData.trend_sections.map(async (section: any) => {
                                if (section.description) {
                                    section.description = (await translateText(section.description, 'en', 'vi')) || section.description;
                                }
                            }));
                        }
                        if (marketData.wash_effect_summary?.table) {
                            await Promise.all(marketData.wash_effect_summary.table.map(async (row: any) => {
                                if (row.application_effect) {
                                    row.application_effect = (await translateText(row.application_effect, 'en', 'vi')) || row.application_effect;
                                }
                            }));
                        }
                        
                        const initialMessage: ChatMessage = {
                            ...finalMessage,
                            content: '',
                            component: <MarketResearchReport data={marketData} theme={effectiveTheme} />,
                            marketResearchData: marketData,
                            isTranslated: true,
                        };

                        setActiveConversationMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1] = initialMessage;
                            return newMessages;
                        });

                        fetchImagesAndUpdateState(marketData);
                    } else { 
                        const data = JSON.parse(jsonString);
                        
                        const [translatedSummary, translatedAnalysis] = await Promise.all([
                            translateText(data.summary, 'en', 'vi'),
                            translateText(data.analysis, 'en', 'vi')
                        ]);
                        
                        finalMessage.summary = (translatedSummary || data.summary)?.replace(/\\n/g, '\n');
                        finalMessage.content = (translatedAnalysis || data.analysis)?.replace(/\\n/g, '\n');

                        const translatedCharts = await Promise.all((data.charts || []).map(async (chart: any) => {
                            const translatedTitle = await translateText(chart.title, 'en', 'vi');
                            const translatedData = await Promise.all((chart.data || []).map(async (point: any) => ({
                                ...point,
                                name: (await translateText(point.name, 'en', 'vi')) || point.name
                            })));
                            return { ...chart, title: translatedTitle || chart.title, data: translatedData };
                        }));

                        const sanitizedCharts = sanitizeChartData(translatedCharts);
                        finalMessage.charts = sanitizedCharts.map((c: any) => ({...c, component: AnalysisChart}));
                        finalMessage.isTranslated = true;
                    }
                }
            } catch(e) {
                console.error("Error post-processing AI JSON response:", e);
                isJsonAnalysis = false; // Fallback to plain text handling
            }
            
            if (!isJsonAnalysis) {
                const textToTranslate = originalEnglishResponse.replace(suggestionRegex, '').trim();
                const vietnameseResponse = await translateText(textToTranslate, 'en', 'vi');
                if (vietnameseResponse && vietnameseResponse.toLowerCase() !== textToTranslate.toLowerCase()) {
                    finalMessage.content = vietnameseResponse;
                    finalMessage.isTranslated = true;
                } else {
                    finalMessage.content = textToTranslate;
                    finalMessage.isTranslated = false;
                    finalMessage.originalContent = undefined; // No original if it's not translated
                }
            }
            
            if (!stateSetForMarketResearch) {
                setActiveConversationMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = finalMessage as ChatMessage;
                    return newMessages;
                });
            }
            break;
          }

          if (chunk.error) {
              const isQuotaError = chunk.error.includes("hạn ngạch");
              
              if (isQuotaError && isAnalysis) {
                  const summary = `**[Lỗi Hạn ngạch]** Phân tích không thể hoàn thành.`;
                  const content = `Yêu cầu phân tích đã thất bại do bạn đã vượt quá hạn ngạch sử dụng API. Biểu đồ không thể được tạo.\n\n- **Để theo dõi mức sử dụng:** [Truy cập Google AI Studio](https://ai.dev/usage)\n- **Để tìm hiểu thêm về giới hạn:** [Xem tài liệu Gemini API](https://ai.google.dev/gemini-api/docs/rate-limits)`;
                  
                  const fallbackMessage: ChatMessage = {
                      role: 'model',
                      summary: summary,
                      content: content,
                      task: analysisPayload?.task,
                      analysisParams: analysisPayload?.params,
                      charts: [], 
                      chartError: 'quota' 
                  };

                  setActiveConversationMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1] = fallbackMessage;
                      return newMessages;
                  });
                  playSound(messageAudio, soundEnabled);
              } else {
                  // For all other errors (including quota errors on non-analysis tasks), just display the error.
                  setActiveConversationMessages(prev => {
                      const newMessages = [...prev];
                      const lastMsg = newMessages[newMessages.length - 1];
                      if (lastMsg?.role === 'model') {
                          lastMsg.content = chunk.error!;
                      }
                      return newMessages;
                  });
              }
              break; 
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Stream failed", error);
          setActiveConversationMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length-1];
              if(lastMsg.role === 'model') {
                lastMsg.content = "Đã có lỗi xảy ra. Vui lòng thử lại.";
              }
              return newMessages;
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, activeConversationMessages, soundEnabled, typingAudio, messageAudio, effectiveTheme, businessProfile]
  );
  
  const handleOnMessageSend = (message: string, image?: { file: File; dataUrl: string }) => {
    sendMessage(message, image);
    setInput('');
  };

  const handleSendAnalysis = (task: Task, params: Record<string, any>) => {
      setActiveTool(null);
      const userMessage = taskTitles[task];
      sendMessage(userMessage, undefined, { task, params });
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleRegenerate = (index: number) => {
    const userMessageIndex = index > 0 && activeConversationMessages[index - 1].role === 'user' ? index - 1 : -1;
    if (userMessageIndex !== -1) {
        const userMessage = activeConversationMessages[userMessageIndex];
        const historyUpToUserMessage = activeConversationMessages.slice(0, userMessageIndex);
        setActiveConversationMessages(historyUpToUserMessage);
        const originalUserInput = userMessage.originalContent || userMessage.content;
        sendMessage(originalUserInput, userMessage.image ? { file: new File([], ''), dataUrl: userMessage.image } : undefined, userMessage.task ? { task: userMessage.task!, params: userMessage.analysisParams! } : undefined);
    }
  };
  
  const handleRefine = useCallback(() => {
    setInput("Dựa trên câu trả lời trên: ");
    setShouldFocusInput(true);
  }, []);
  
  const handleEditAnalysis = (message: ChatMessage) => {
      if (message.task && message.analysisParams) {
          setActiveTool({
              task: message.task,
              initialData: message.analysisParams
          });
      }
  };

  // --- User Message Editing ---
  const handleInitiateEdit = (messageId: number) => {
    setEditingMessageId(messageId);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  const handleSaveAndSubmitEdit = (messageId: number, newContent: string) => {
    const messageIndex = activeConversationMessages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const originalMessage = activeConversationMessages[messageIndex];
    if (originalMessage.role === 'user' && originalMessage.content === newContent) {
        setEditingMessageId(null);
        return; // No change
    }

    const historyBeforeEdit = activeConversationMessages.slice(0, messageIndex);
    
    setActiveConversationMessages(historyBeforeEdit);
    setEditingMessageId(null);

    if (originalMessage.role === 'user') {
        sendMessage(
            newContent,
            originalMessage.image ? { file: new File([], ''), dataUrl: originalMessage.image } : undefined,
            originalMessage.task && originalMessage.analysisParams ? { task: originalMessage.task, params: originalMessage.analysisParams } : undefined
        );
    }
  };

  // --- Feedback & Fine-tuning ---
  const handleOpenFeedbackDialog = (message: ChatMessage, index: number) => {
      setFeedbackDialogState({ isOpen: true, message, index });
  };
  
  const handleSaveFeedback = async (message: ChatMessage, feedback: Feedback) => {
    if (feedbackDialogState.index === null) return;
    
    setActiveConversationMessages(prev => {
        const newMessages = [...prev];
        if(newMessages[feedbackDialogState.index!]) {
            newMessages[feedbackDialogState.index!].feedback = feedback;
        }
        return newMessages;
    });
    setFeedbackDialogState({ isOpen: false, message: null, index: null });
    
    const prevUserMessage = activeConversationMessages[feedbackDialogState.index - 1];
    const isCorrectionScenario = 
      feedback.rating <= 3 && 
      !feedback.correction &&
      prevUserMessage?.role === 'user';
      
    if (isCorrectionScenario) {
      // Logic for future implementation
    }
    
    if (feedback.correction) {
       const prevUserMessage = activeConversationMessages[feedbackDialogState.index - 1];
       if (prevUserMessage && prevUserMessage.role === 'user' && message.role === 'model') {
           const idealResponse = await createFineTuningExampleFromCorrection(
               prevUserMessage.content,
               message.content,
               feedback.correction
           );
           if (idealResponse) {
               const newExample: FineTuningExample = {
                   id: Date.now().toString(),
                   originalPrompt: prevUserMessage.content,
                   improvedResponse: idealResponse,
               };
               await apiService.saveFineTuningExample(newExample);
               setFineTuningExamples(prev => [...prev, newExample]);
           }
       }
    }
  };

  const handleFeedback = (messageIndex: number, feedback: 'positive') => {
      setActiveConversationMessages(prev => {
          const newMessages = [...prev];
          if(newMessages[messageIndex]) {
              newMessages[messageIndex].feedback = { rating: 5, issues: [] };
          }
          return newMessages;
      });
  };

  // --- Comparison ---
  const handleToggleCompare = (index: number) => {
      setComparisonSelection(prev => {
          if (prev.includes(index)) {
              return prev.filter(i => i !== index);
          }
          if (prev.length < 2) {
              return [...prev, index];
          }
          return [prev[1], index];
      });
  };

  // --- Export ---
  const handleExportChat = () => setIsExportDialogOpen(true);

  const exportChatAs = async (format: 'png' | 'txt') => {
      if (!chatWindowRef.current) return;
      setIsExporting(true);

      const convoTitle = activeConversationId ? conversations[activeConversationId]?.title : "conversation";
      const filename = `V64 Chat - ${convoTitle.replace(/[^a-z0-9]/gi, '_')}.${format}`;
      
      try {
          if (format === 'png') {
              const dataUrl = await toPng(chatWindowRef.current, { quality: 0.95, backgroundColor: effectiveTheme === 'dark' ? '#0f172a' : '#f8fafc' });
              const link = document.createElement('a');
              link.download = filename;
              link.href = dataUrl;
              link.click();
          } else { 
              const textContent = activeConversationMessages.map(msg => {
                  const prefix = msg.role === 'user' ? '👤 You:' : '🤖 AI:';
                  return `${prefix}\n${msg.content}\n\n${msg.sources ? 'Sources:\n' + msg.sources.map(s => `- ${s.title}: ${s.uri}`).join('\n') + '\n\n' : ''}`;
              }).join('--------------------------------\n\n');
              const blob = new Blob([textContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = filename;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
          }
      } catch (error) {
          console.error(`Failed to export chat as ${format}`, error);
          alert(`Đã xảy ra lỗi khi xuất file ${format}.`);
      } finally {
          setIsExporting(false);
          setIsExportDialogOpen(false);
      }
  };
  
  // --- Profile & Settings ---
  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    apiService.saveUserProfile(profile);
  };
  
  const handleSaveBusinessProfile = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    apiService.saveBusinessProfile(profile);
  };

  const handleForgetUser = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả dữ liệu (hồ sơ, lịch sử chat) khỏi trình duyệt này không?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col font-${font}`}>
      <main className="flex-1 flex h-full overflow-hidden">
        <Sidebar
          conversations={Object.values(conversations)}
          conversationGroups={conversationGroups}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={(id) => setDeleteConfirmation({ type: 'convo', id })}
          onRenameConversation={handleRenameConversation}
          onCreateGroup={handleCreateGroup}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={(id) => setDeleteConfirmation({ type: 'group', id })}
          onAssignConversationToGroup={handleAssignConversationToGroup}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        <div className="flex-1 flex flex-col relative">
          <header className="flex items-center justify-between p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-slate-100">
                  {activeView === 'products' ? 'Quản lý Sản phẩm'
                    : activeView === 'report' ? 'Báo cáo Power BI'
                    : conversations[activeConversationId!]?.title || 'Trò chuyện'}
                </h1>
                {activeView === 'chat' && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5 text-base sm:text-lg font-semibold">
                      <BriefcaseIcon className="w-5 h-5" />
                      <span>Business AI</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
                <SourceFilterControl sources={allSources} activeFilter={sourceFilter} onFilterChange={setSourceFilter} />
                <button
                    onClick={() => setIsFindBarVisible(v => !v)}
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Tìm kiếm (Ctrl+F)"
                >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
                <div id="tour-step-6-settings-button">
                  <SettingsPopover
                    theme={theme} setTheme={setTheme}
                    font={font} setFont={setFont}
                    userProfile={userProfile} onUpdateProfile={handleUpdateProfile}
                    onForgetUser={handleForgetUser}
                    soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
                    onOpenWorkflow={() => setIsWorkflowOpen(true)}
                    onOpenTestingGuide={() => setIsTestingGuideOpen(true)}
                    onOpenBusinessProfile={() => setIsBusinessProfileOpen(true)}
                  />
                </div>
            </div>
          </header>
          
          <FindBar isVisible={isFindBarVisible} onClose={() => setIsFindBarVisible(false)} containerRef={chatWindowRef} />

          {activeView === 'chat' ? (
              <>
                 {activeConversationMessages.length === 0 && !isLoading ? (
                    <Welcome onSuggestionClick={handleSuggestionClick} onToolSelect={(task) => setActiveTool({task})} />
                ) : (
                    <ChatWindow
                      ref={chatWindowRef}
                      messages={filteredMessages}
                      isLoading={isLoading}
                      onSuggestionClick={handleSuggestionClick}
                      onFeedback={handleFeedback}
                      onOpenFeedbackDialog={handleOpenFeedbackDialog}
                      onRegenerate={handleRegenerate}
                      onRefine={handleRefine}
                      comparisonSelection={comparisonSelection}
                      onToggleCompare={handleToggleCompare}
                      onEditAnalysis={handleEditAnalysis}
                      sourceFilter={sourceFilter}
                      effectiveTheme={effectiveTheme}
                      onSourceFilterChange={setSourceFilter}
                      editingMessageId={editingMessageId}
                      onInitiateEdit={handleInitiateEdit}
                      onCancelEdit={handleCancelEdit}
                      onSaveEdit={handleSaveAndSubmitEdit}
                    />
                )}
                 {comparisonSelection.length > 0 && (
                    <ComparisonToolbar 
                        selection={comparisonSelection}
                        messages={activeConversationMessages}
                        onCompare={() => setIsComparisonDialogOpen(true)}
                        onClear={() => setComparisonSelection([])}
                    />
                )}
                <MessageInput
                  input={input}
                  setInput={setInput}
                  onSendMessage={handleOnMessageSend}
                  onSendAnalysis={handleSendAnalysis}
                  isLoading={isLoading}
                  onNewChat={handleNewChat}
                  onClearChat={handleClearChat}
                  onExportChat={handleExportChat}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  onStopGeneration={handleStopGeneration}
                  businessProfile={businessProfile}
                  shouldFocusInput={shouldFocusInput}
                  setShouldFocusInput={setShouldFocusInput}
                />
              </>
          ) : activeView === 'products' ? (
              <ProductCatalog
                  profile={businessProfile}
                  onSave={handleSaveBusinessProfile}
              />
          ) : (
              <PowerBIReport />
          )}

        </div>
      </main>

       {/* Dialogs */}
        <GuidedTour
            isOpen={showGuidedTour}
            onClose={() => setShowGuidedTour(false)}
            steps={tourSteps}
        />
        {showOnboardingPrompt && (
            <OnboardingPrompt
                onConfirm={handleConfirmOnboarding}
                onDecline={handleDeclineOnboarding}
            />
        )}
        <WorkflowDialog isOpen={isWorkflowOpen} onClose={() => setIsWorkflowOpen(false)} />
        <TestingGuideDialog isOpen={isTestingGuideOpen} onClose={() => setIsTestingGuideOpen(false)} />
        {businessProfile && <BusinessProfileDialog isOpen={isBusinessProfileOpen} onClose={() => setIsBusinessProfileOpen(false)} profile={businessProfile} onSave={handleSaveBusinessProfile} />}
        <ExportDialog isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} onExportPng={() => exportChatAs('png')} onExportTxt={() => exportChatAs('txt')} isExporting={isExporting}/>
        {comparisonSelection.length === 2 && (
            <SourceComparisonDialog
                isOpen={isComparisonDialogOpen}
                onClose={() => setIsComparisonDialogOpen(false)}
                message1={activeConversationMessages[comparisonSelection[0]]}
                message2={activeConversationMessages[comparisonSelection[1]]}
            />
        )}
         {feedbackDialogState.isOpen && feedbackDialogState.message && (
             <FeedbackDialog
                isOpen={feedbackDialogState.isOpen}
                onClose={() => setFeedbackDialogState({isOpen: false, message: null, index: null})}
                message={feedbackDialogState.message}
                onSave={handleSaveFeedback}
             />
         )}
        <ConfirmationDialog
            isOpen={!!deleteConfirmation}
            onClose={() => setDeleteConfirmation(null)}
            onConfirm={() => {
                if (deleteConfirmation?.type === 'convo') handleDeleteConversation(deleteConfirmation.id);
                if (deleteConfirmation?.type === 'group') handleDeleteGroup(deleteConfirmation.id);
                setDeleteConfirmation(null);
            }}
            title={deleteConfirmation?.type === 'convo' ? "Xóa cuộc trò chuyện?" : "Xóa nhóm?"}
            message={deleteConfirmation?.type === 'convo' ? "Hành động này không thể hoàn tác." : "Các cuộc trò chuyện trong nhóm sẽ không bị xóa."}
        />
    </div>
  );
};

export default App;
