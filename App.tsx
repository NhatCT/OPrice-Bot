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
import { getChatResponseStream, translateText, createFineTuningExampleFromCorrection, findImageFromSearchQuery } from "./services/geminiService";
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

/* ===========================================================
   ================= CONSTANTS & CONFIG ======================
   =========================================================== */
const THEME_KEY = "theme";
const FONT_KEY = "font";
const SOUND_ENABLED_KEY = "soundEnabled";
const ACTIVE_CONVERSATION_ID_KEY = "activeConversationId";

const taskTitles: Record<Task, string> = {
  'profit-analysis': 'Phân tích Lợi nhuận & Lập kế hoạch Kinh doanh',
  'promo-price': 'Phân tích & Dự báo Hiệu quả Khuyến mãi',
  'group-price': 'Phân tích Chiến dịch Đồng giá',
  'market-research': 'Nghiên cứu Xu hướng & Lên ý tưởng Bộ sưu tập',
  'brand-positioning': 'Định vị Thương hiệu'
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

const translateChartData = async (charts: any[]): Promise<any[]> => {
    if (!charts || !Array.isArray(charts)) return [];

    const translatedCharts = await Promise.all(
        charts.map(async (chart) => {
            // Translate chart title
            const translatedTitle = chart.title ? await translateText(chart.title, 'en', 'vi') : chart.title;

            // Translate data point names
            const translatedData = chart.data && Array.isArray(chart.data)
                ? await Promise.all(
                    chart.data.map(async (dataPoint: any) => {
                        if (typeof dataPoint.name === 'string') {
                            const translatedName = await translateText(dataPoint.name, 'en', 'vi');
                            return { ...dataPoint, name: translatedName || dataPoint.name };
                        }
                        return dataPoint;
                    })
                )
                : chart.data; // Keep original if not an array

            return {
                ...chart,
                title: translatedTitle || chart.title,
                data: translatedData,
            };
        })
    );

    return translatedCharts;
};

const buildAnalysisPrompt = (task: Task, params: Record<string, any>): string => {
  if (task === 'market-research') {
        const competitors = Array.isArray(params.competitors) ? params.competitors.join(', ') : params.competitors || 'None';
        const useSearch = competitors && competitors.length > 0;
        return `YÊU CẦU ĐỊNH DẠNG ĐẦU RA: JSON. You are a world-class Fashion Trend Analyst. Conduct a detailed fashion trend report based on the criteria below. ${useSearch ? 'Use Google Search extensively to gather real-time, relevant information from top sources like WGSN, Vogue Runway, and Business of Fashion.' : ''} The analysis must be structured like a professional presentation for a fashion brand's product development team.

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
      "description": "- [Key characteristic 1 in Vietnamese]\\n- [Key characteristic 2 in Vietnamese]",
      "key_items": [
        { "brand_name": "[Brand Name 1]", "image_search_query": "[Concise English query for a real runway/studio photo of an item from this brand and trend]" },
        { "brand_name": "[Brand Name 2]", "image_search_query": "[...]" },
        { "brand_name": "[Brand Name 3]", "image_search_query": "[...]" },
        { "brand_name": "[Brand Name 4]", "image_search_query": "[...]" },
        { "brand_name": "[Brand Name 5]", "image_search_query": "[...]" }
      ]
    }
  ],
  "wash_effect_summary": {
    "title": "4. Washing Effect – Hiệu ứng wash",
    "table": [
      { "wash_type": "[Name of Wash 1]", "application_effect": "[Description in Vietnamese]" },
      { "wash_type": "[Name of Wash 2]", "application_effect": "[...]" }
    ]
  }
}
For 'image_search_query', create a concise, effective query for an image search engine to find a REAL runway, studio, or street style photo. Example: "runway photo of baggy stone wash jeans Nili Lotan Fall 2024".
`;
  }
    
  const intro = `REQUIRED OUTPUT FORMAT: JSON
TASK: Perform a business analysis based on the following data.
Analyze the data and provide a summary of key metrics, a detailed analysis text, and a data array for charts.
The JSON output must contain three keys: "summary" (string), "analysis" (string), and "charts" (array of objects).
The "summary" string MUST be a concise summary of the key metrics, with important numbers formatted in bold Markdown (e.g., **1,234,567 VND**).
The "analysis" and "summary" strings must escape newlines as \\n.
The "charts" array must contain objects with "type", "title", "unit", and "data" keys.
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
        // FIX: Added a role check to prevent assigning components to user messages
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
  const [activeView, setActiveView] = useState<'chat' | 'products'>('chat');

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [font, setFont] = useState<Font>('sans');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [fineTuningExamples, setFineTuningExamples] = useState<FineTuningExample[]>([]);
  
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
        // Process messages to re-attach non-serializable components
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
      // Show user messages that preceded a filtered model message, and the model messages themselves.
      const filtered: ChatMessage[] = [];
      for(let i = 0; i < activeConversationMessages.length; i++) {
          const msg = activeConversationMessages[i];
          if(msg.role === 'model' && msg.sources?.some(s => s.uri === sourceFilter)) {
              // Find the preceding user message(s)
              for(let j = i - 1; j >= 0; j--) {
                  const prevMsg = activeConversationMessages[j];
                  if(prevMsg.role === 'user') {
                      if(!filtered.includes(prevMsg)) {
                          filtered.push(prevMsg);
                      }
                      break; // Found the direct user prompt, stop searching back
                  }
              }
              filtered.push(msg);
          }
      }
      return filtered;
  }, [activeConversationMessages, sourceFilter]);

  /* ===================== CALLBACKS & HANDLERS ===================== */
  
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
    if (Object.keys(conversations).length <= 1) return; // Can't delete the last one
    
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

      let userMessage: ChatMessage = { role: 'user', content: userInput };
      if (image) userMessage.image = image.dataUrl;
      if(analysisPayload) {
        userMessage.analysisParams = analysisPayload.params;
        userMessage.task = analysisPayload.task;
      }
      
      const updatedMessages = [...activeConversationMessages, userMessage];
      setActiveConversationMessages(updatedMessages);
      setIsLoading(true);

      const modelResponse: ChatMessage = { role: 'model', content: '' };
      setActiveConversationMessages(prev => [...prev, modelResponse]);
      
      // --- Special handling for Brand Positioning ---
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
      
      const competitors = analysisPayload?.params?.competitors;
      const hasCompetitors = competitors && Array.isArray(competitors) && competitors.length > 0;
      
      if(analysisPayload && !hasCompetitors) {
          const { task, params } = analysisPayload;
          let localResult: AnalysisResult | null = null;
          
          if (task === 'profit-analysis') localResult = businessService.buildProfitAnalysis(businessProfile, params);
          if (task === 'promo-price') localResult = businessService.buildPromoAnalysis(businessProfile, params);
          if (task === 'group-price') localResult = businessService.buildGroupPriceAnalysis(businessProfile, params);
          
          if (localResult) {
              setActiveConversationMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg.role === 'model') {
                    lastMsg.content = localResult.analysis;
                    lastMsg.charts = localResult.charts.map(c => ({...c, component: AnalysisChart}));
                    lastMsg.analysisParams = params;
                    lastMsg.task = task;
                  }
                  return newMessages;
              });
              setIsLoading(false);
              playSound(messageAudio, soundEnabled);
              return;
          }
      }
      
      let finalPrompt = userInput;
      if (analysisPayload) {
          finalPrompt = buildAnalysisPrompt(analysisPayload.task, analysisPayload.params);
      }
      
      const userMessageForHistory = {...userMessage, content: finalPrompt};
      
      const translatedPrompt = await translateText(finalPrompt, 'vi', 'en');
      if (translatedPrompt && translatedPrompt !== finalPrompt) {
          userMessageForHistory.isTranslated = true;
          userMessageForHistory.originalContent = finalPrompt;
          userMessageForHistory.content = translatedPrompt;
      }

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
            
            let finalMessage: ChatMessage = {
                role: 'model',
                content: accumulatedText,
                sources: chunk.sources,
                performance: chunk.performanceMetrics,
                analysisParams: analysisPayload?.params,
                task: analysisPayload?.task,
            };

            // Post-process for JSON analysis
            try {
                if (finalMessage.role === 'model' && finalMessage.task && (finalMessage.content.includes('{') || finalMessage.content.includes('```json'))) {
                    
                    let jsonString = finalMessage.content.replace(/```json\n?/g, "").replace(/```/g, "").trim();

                    if(finalMessage.task === 'market-research') {
                        const marketData = JSON.parse(jsonString);
                        finalMessage.content = `Đang tìm hình ảnh minh họa cho ${marketData.trend_sections?.length || 0} xu hướng...`;
                        finalMessage.component = <MarketResearchReport data={marketData} theme={effectiveTheme} />;
                        finalMessage.marketResearchData = marketData;
                        
                        // Async update message with found images
                        setActiveConversationMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? (finalMessage as ChatMessage) : msg));

                        if (marketData.trend_sections && Array.isArray(marketData.trend_sections)) {
                            for (const section of marketData.trend_sections) {
                                if (section.key_items && Array.isArray(section.key_items)) {
                                    await Promise.all(section.key_items.map(async (item: any) => {
                                        if (item.image_search_query) {
                                            const imageUrl = await findImageFromSearchQuery(item.image_search_query);
                                            if (imageUrl) {
                                                item.image_url = imageUrl;
                                                // Re-render with the new image
                                                setActiveConversationMessages(prev => {
                                                    const newMessages = [...prev];
                                                    const targetMsg = newMessages.find(m => m.id === finalMessage.id);
                                                    if(targetMsg && targetMsg.role === 'model' && targetMsg.marketResearchData) {
                                                        targetMsg.component = <MarketResearchReport data={targetMsg.marketResearchData} theme={effectiveTheme} />;
                                                    }
                                                    return newMessages;
                                                });
                                            }
                                        }
                                    }));
                                }
                            }
                        }
                         finalMessage.content = '';

                    } else {
                        const data = JSON.parse(jsonString);
                        const unescapedSummary = data.summary ? data.summary.replace(/\\n/g, '\n') : '';
                        const unescapedAnalysis = data.analysis ? data.analysis.replace(/\\n/g, '\n') : 'Không có phân tích.';
                        finalMessage.summary = (await translateText(unescapedSummary, 'en', 'vi') || unescapedSummary);
                        finalMessage.content = (await translateText(unescapedAnalysis, 'en', 'vi') || unescapedAnalysis);
                        const translatedCharts = await translateChartData(data.charts);
                        finalMessage.charts = translatedCharts.map((c: any) => ({...c, component: AnalysisChart}));
                    }
                } else {
                     const translatedFinal = await translateText(finalMessage.content, 'en', 'vi');
                     if (translatedFinal) {
                         finalMessage.isTranslated = true;
                         finalMessage.originalContent = finalMessage.content;
                         finalMessage.content = translatedFinal;
                     }
                }

            } catch(e) {
                console.error("Error post-processing AI response:", e);
                if (finalMessage.role === 'model') {
                  finalMessage.content += "\n\n(Lỗi: Không thể phân tích dữ liệu trả về từ AI.)";
                }
            }
            
            setActiveConversationMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = finalMessage as ChatMessage;
                return newMessages;
            });
            break;
          }

          if (chunk.error) {
              setActiveConversationMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length-1];
                  if(lastMsg.role === 'model') {
                    lastMsg.content = chunk.error!;
                  }
                  return newMessages;
              });
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
    [isLoading, activeConversationMessages, soundEnabled, typingAudio, messageAudio, businessProfile, effectiveTheme]
  );
  
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
        sendMessage(userMessage.content, userMessage.image ? { file: new File([], ''), dataUrl: userMessage.image } : undefined, { task: userMessage.task!, params: userMessage.analysisParams! });
    }
  };
  
  const handleEditAnalysis = (message: ChatMessage) => {
      if (message.task && message.analysisParams) {
          setActiveTool({
              task: message.task,
              initialData: message.analysisParams
          });
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
    
    // Check if we should create a fine-tuning example
    const prevUserMessage = activeConversationMessages[feedbackDialogState.index - 1];
    const isCorrectionScenario = 
      feedback.rating <= 3 && 
      !feedback.correction && // User provides correction in next message
      prevUserMessage?.role === 'user';
      
    if (isCorrectionScenario) {
      // Logic to wait for next user message and then call createFineTuningExample
      // This part is complex due to async nature and will be implemented if required.
      // For now, we save the feedback. If a correction is provided directly, we can use it.
    }
    
    if (feedback.correction) {
       // A direct correction was provided in the dialog.
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
          return [prev[1], index]; // Keep the last one and add the new one
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
          } else { // txt
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
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {activeView === 'products' ? 'Quản lý Sản phẩm' : conversations[activeConversationId!]?.title || 'Trò chuyện'}
              </h1>
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
                      comparisonSelection={comparisonSelection}
                      onToggleCompare={handleToggleCompare}
                      onEditAnalysis={handleEditAnalysis}
                      sourceFilter={sourceFilter}
                      effectiveTheme={effectiveTheme}
                      onSourceFilterChange={setSourceFilter}
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
                  onSendMessage={sendMessage}
                  onSendAnalysis={handleSendAnalysis}
                  isLoading={isLoading}
                  onNewChat={handleNewChat}
                  onClearChat={handleClearChat}
                  onExportChat={handleExportChat}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  onStopGeneration={handleStopGeneration}
                  businessProfile={businessProfile}
                />
              </>
          ) : (
              <ProductCatalog
                  profile={businessProfile}
                  onSave={handleSaveBusinessProfile}
              />
          )}

        </div>
      </main>

       {/* Dialogs */}
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