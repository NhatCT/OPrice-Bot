
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { Welcome } from './components/Welcome';
import { SettingsPopover } from './components/SettingsPopover';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { FeedbackDialog } from './components/FeedbackDialog';
import { BusinessProfileDialog } from './components/BusinessProfileDialog';
import { ComparisonToolbar } from './components/ComparisonToolbar';
import { SourceComparisonDialog } from './components/SourceComparisonDialog';
import { SourceFilterControl } from './components/SourceFilterControl';
import { FindBar } from './components/FindBar';
import { ProductCatalog } from './components/ProductCatalog';
import { Watchlist } from './components/Watchlist';
import { LookerStudioReport } from './components/LookerStudioReport';
import { WorkflowDialog } from './components/WorkflowDialog';
import { TestingGuideDialog } from './components/TestingGuideDialog';
import { OnboardingPrompt } from './components/OnboardingPrompt';
import { OnboardingDialog } from './components/OnboardingDialog';
import { GuidedTour, TourStep } from './components/GuidedTour';
import { CompetitorSelectionDialog } from './components/CompetitorSelectionDialog';
import { ExportDialog } from './components/ExportDialog';
import { MenuIcon } from './components/icons/MenuIcon';
import { ArchiveBoxIcon } from './components/icons/ArchiveBoxIcon';
import { MagnifyingGlassIcon } from './components/icons/MagnifyingGlassIcon';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';

import { 
    getChatResponseStream, 
    createFineTuningExampleFromCorrection,
    fetchShopeeProductInfo,
    fetchIconDenimProductInfo,
    fetchLeviProductInfo
} from './services/geminiService';
import { 
  loadConversations, loadMessages, saveMessages, createNewConversation, 
  saveConversationMeta, deleteConversation, loadUserProfile, saveUserProfile,
  loadBusinessProfile, saveBusinessProfile, loadConversationGroups, saveConversationGroups,
  createConversationGroup, renameConversationGroup, deleteConversationGroup, assignConversationToGroup,
  saveFineTuningExample
} from './services/apiService';
import { performProfitAnalysis, performPromoAnalysis, performGroupPriceAnalysis, CalculatedResult } from './services/businessService';

import type { ChatMessage, UserProfile, ConversationMeta, Task, BusinessProfile, AnalysisCategory, ConversationGroup, WatchedProduct, Feedback, Theme, Font, ActiveTool } from './types';
import { messageReceivedSound } from './assets/messageReceivedSound';
import { typingSound } from './assets/typingSound';
import html2canvas from 'html2canvas';
import { BrandPositioningMap } from './components/BrandPositioningMap';
import { MarketResearchReport } from './components/MarketResearchReport';
import { AnalysisChart } from './components/charts/AnalysisChart';

// --- CONSTANTS ---
const THEME_KEY = "theme";
const FONT_KEY = "font";
const SOUND_ENABLED_KEY = "soundEnabled";

const tourSteps: TourStep[] = [
    { elementId: 'tour-step-1-new-chat', title: 'Bắt đầu mới', description: 'Nhấn vào đây để tạo cuộc trò chuyện mới.' },
    { elementId: 'tour-step-2-convo-list', title: 'Lịch sử', description: 'Quản lý các cuộc trò chuyện của bạn ở đây.', position: 'right' },
    { elementId: 'tour-step-3-view-switcher', title: 'Chế độ xem', description: 'Chuyển đổi giữa Chat, Sản phẩm, Theo dõi và Báo cáo.', position: 'right' },
    { elementId: 'tour-step-4-message-input', title: 'Nhập liệu', description: 'Nhập câu hỏi hoặc tải ảnh lên tại đây.', position: 'top' },
    { elementId: 'tour-step-5-tools-button', title: 'Công cụ', description: 'Truy cập các công cụ phân tích chuyên sâu.', position: 'top' },
];

const taskTitles: Record<Task, string> = {
  'profit-analysis': 'Phân tích Lợi nhuận',
  'promo-price': 'Phân tích Khuyến mãi',
  'group-price': 'Phân tích Đồng giá',
  'market-research': 'Nghiên cứu Xu hướng',
  'brand-positioning': 'Định vị Thương hiệu',
  'competitor-analysis': 'Phân tích Đối thủ',
  'keyword-analysis': 'Phân tích Từ khoá',
  'collection-analysis': 'Phân tích Bộ sưu tập',
  'content-generation': 'Tạo Nội dung Marketing'
};

const buildAnalysisPrompt = (task: Task, params: Record<string, any>, dnaContext: string = ''): string => {
  if (task === 'market-research') {
        const competitors = Array.isArray(params.competitors) ? params.competitors.join(', ') : params.competitors || 'None';
        const useSearch = competitors && competitors.length > 0;
        
        let prompt = `REQUIRED OUTPUT FORMAT: JSON. You are a Data-Driven Fashion Analyst. Conduct a detailed denim trend report.
${dnaContext}
IMPORTANT: All text content MUST be in English.

**CRITICAL REQUIREMENT: EVIDENCE & CREDIBILITY**
You MUST NOT just list trends. You MUST prove them with data and specific examples.
For every trend, you must identify:
1.  **Specific Collections:** Which brands/runways launched this? (e.g., "Diesel SS25").
2.  **Data/Statistics:** Estimated growth or search volume.
3.  **Application:** Where is this actually worn?

**RESPONSE STRUCTURE GUIDE:**
The JSON output MUST follow this exact structure:
{
  "executive_summary": "[High-level summary, <50 words]",
  "adoption_stats": [
    {
      "trend_name": "[Name]",
      "growth_metric": "[e.g., '+45% YoY']",
      "market_share": "[e.g., 'Mass Market']",
      "key_collections": ["[Collection 1]"],
      "application_context": ["[Context 1]"]
    }
  ],
  "trend_sections": [
    {
      "title": "1. Trend Core – [Name]",
      "description": "### [Sub-trend Name]\\n- **Visual:** ...",
      "key_items": [
        { "inspiration_source": "[Source]", "image_search_query": "[Prompt]" }
      ]
    }
  ],
  "wash_effect_summary": {
    "title": "Washing Effect Summary",
    "table": [
      { "wash_type": "[Name]", "application_effect": "[Description]" }
    ]
  }
}
`;
        if (params.focusVietnam) {
            prompt += `\n**CRITICAL: FOCUS ON VIETNAM.** Prioritize trends seen on Shopee.vn, TikTok Shop Vietnam.`;
        }
        prompt += `\nCRITERIA:\n- Season: ${params.season} ${params.year}\n- Keywords: ${params.style_keywords}`;
        return prompt;
  }
  return JSON.stringify(params);
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

export const App: React.FC = () => {
    // --- STATE ---
    const [theme, setTheme] = useState<Theme>('system');
    const [font, setFont] = useState<Font>('sans');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
    
    const [conversations, setConversations] = useState<ConversationMeta[]>([]);
    const [conversationGroups, setConversationGroups] = useState<Record<string, ConversationGroup>>({});
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<'chat' | 'products' | 'report' | 'watchlist'>('chat');
    const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
    
    const [watchlist, setWatchlist] = useState<WatchedProduct[]>([]);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);
    const [comparisonSelection, setComparisonSelection] = useState<number[]>([]);
    
    // Dialogs
    const [feedbackDialogState, setFeedbackDialogState] = useState<{ isOpen: boolean; message: ChatMessage | null; index: number }>({ isOpen: false, message: null, index: -1 });
    const [isBusinessProfileOpen, setIsBusinessProfileOpen] = useState(false);
    const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
    const [isTestingGuideOpen, setIsTestingGuideOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
    const [showCompetitorDialog, setShowCompetitorDialog] = useState(false);
    const [competitorUrl, setCompetitorUrl] = useState('');
    const [isSourceComparisonOpen, setIsSourceComparisonOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isFindBarVisible, setIsFindBarVisible] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'convo' | 'group', id: string } | null>(null);
    const [tourOpen, setTourOpen] = useState(false);

    // Editing
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [shouldFocusInput, setShouldFocusInput] = useState(false);

    // Refs
    const abortControllerRef = useRef<AbortController | null>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const typingAudioRef = useRef<HTMLAudioElement>(null);

    // Computed
    const effectiveTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

    // --- HANDLERS ---

    const handleNewChat = useCallback(async () => {
        const newConvo = await createNewConversation();
        if (newConvo) {
            const allConvos = await loadConversations();
            setConversations(Object.values(allConvos).sort((a, b) => Number(b.id) - Number(a.id)));
            setActiveConversationId(newConvo.id);
            setMessages([]);
            setInput('');
            setActiveTool(null);
            setActiveView('chat');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }
    }, []);

    const handleSelectConversation = async (id: string) => {
        if (activeConversationId === id) return;
        setActiveConversationId(id);
        const msgs = await loadMessages(id);
        setMessages(processMessagesWithComponents(msgs, effectiveTheme));
        setActiveView('chat');
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleUpdateWatchlistItem = async (id: string) => {
        const item = watchlist.find(w => w.id === id);
        if (!item) return;

        let newPrice = item.lastPrice;
        try {
            let info;
            if (item.platform === 'Shopee' || item.url.includes('shopee.vn')) {
                info = await fetchShopeeProductInfo(item.url);
            } else if (item.platform === 'Icon Denim' || item.url.includes('icondenim.com')) {
                info = await fetchIconDenimProductInfo(item.url);
            } else if (item.platform === 'Levi\'s' || item.url.includes('levi.com')) {
                info = await fetchLeviProductInfo(item.url);
            }
            
            if (info && info.price) {
                newPrice = info.price.toLocaleString('vi-VN') + ' VND';
            }
        } catch (e) {
            console.error("Failed to update item", id, e);
        }

        const updatedList = watchlist.map(w => w.id === id ? { ...w, lastPrice: newPrice, lastUpdated: new Date().toISOString() } : w);
        setWatchlist(updatedList);
        if (businessProfile) saveBusinessProfile({ ...businessProfile, watchlist: updatedList });
    };

    const handleUpdateAllWatchlist = async () => {
        for (const item of watchlist) {
            await handleUpdateWatchlistItem(item.id);
        }
    };

    const handleRemoveFromWatchlist = (id: string) => {
         const newList = watchlist.filter(w => w.id !== id);
         setWatchlist(newList);
         if(businessProfile) saveBusinessProfile({...businessProfile, watchlist: newList});
    };

    const handleAddToWatchlist = (product: any) => {
      const newProduct: WatchedProduct = {
          id: product.id || `${Date.now()}`,
          name: product.name || product.productName,
          url: product.url || product.link || '',
          platform: product.platform || 'Shopee',
          initialPrice: product.price,
          lastPrice: product.price,
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
      };
      
      const currentList = watchlist;
      if (currentList.some(p => p.name === newProduct.name)) return;

      const newList = [...currentList, newProduct];
      setWatchlist(newList);
      if (businessProfile) saveBusinessProfile({ ...businessProfile, watchlist: newList });
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    };

    const handleSaveEdit = async (messageId: number, newContent: string) => {
        setEditingMessageId(null);
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;
        const newHistory = messages.slice(0, msgIndex);
        setMessages(newHistory);
        await handleSendMessage(newContent);
    };

    const handleFeedback = async (message: ChatMessage, feedback: Feedback) => {
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, feedback } : m));
        setFeedbackDialogState({ isOpen: false, message: null, index: -1 });
        if (feedback.correction && activeConversationId) {
            const msgIndex = messages.findIndex(m => m.id === message.id);
            const prompt = msgIndex > 0 ? messages[msgIndex - 1].content : '';
            if (prompt) {
                const fineTuningData = await createFineTuningExampleFromCorrection(prompt, message.content, feedback.correction);
                if (fineTuningData) {
                    await saveFineTuningExample({
                        id: `ft-${Date.now()}`,
                        originalPrompt: prompt,
                        improvedResponse: fineTuningData,
                        category: 'better_advice'
                    });
                }
            }
            await saveMessages(activeConversationId, messages);
        }
    };

    const handleExportChat = async (type: 'png' | 'txt') => {
        setIsExporting(true);
        if (type === 'txt') {
            const content = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content}\n`).join('\n-------------------\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-export-${new Date().toISOString()}.txt`;
            a.click();
            setIsExporting(false);
            setIsExportOpen(false);
        } else {
            if (chatWindowRef.current) {
                try {
                    const canvas = await html2canvas(chatWindowRef.current, {
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        scale: 2,
                        useCORS: true,
                        logging: false
                    });
                    const link = document.createElement('a');
                    link.download = `chat-export-${new Date().toISOString()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } catch (err) {
                    console.error("Export failed", err);
                    alert("Không thể xuất ảnh. Vui lòng thử lại.");
                } finally {
                    setIsExporting(false);
                    setIsExportOpen(false);
                }
            }
        }
    };

    const handleSendMessage = async (content: string, image?: { file: File; dataUrl: string }) => {
        if (!content.trim() && !image) return;
        if (!activeConversationId) await handleNewChat();
        
        const newUserMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: content,
            image: image?.dataUrl,
            timestamp: Date.now()
        } as any;

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);
        if (soundEnabled && typingAudioRef.current) typingAudioRef.current.play().catch(()=>{});

        const assistantMessageId = Date.now() + 1;
        const assistantMessage: ChatMessage = { id: assistantMessageId, role: 'model', content: '' };
        setMessages(prev => [...prev, assistantMessage]);

        abortControllerRef.current = new AbortController();

        try {
            const stream = getChatResponseStream(updatedMessages, abortControllerRef.current.signal);
            let responseText = '';

            for await (const chunk of stream) {
                if (chunk.textChunk) {
                    responseText += chunk.textChunk;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last.id === assistantMessageId) last.content = responseText;
                        return newMsgs;
                    });
                }
                if (chunk.sources) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last.id === assistantMessageId) last.sources = chunk.sources;
                        return newMsgs;
                    });
                }
                if (chunk.error) {
                     setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last.id === assistantMessageId) last.content += `\n\n[Lỗi: ${chunk.error}]`;
                        return newMsgs;
                    });
                }
            }
            
            if (activeConversationId) {
                await saveMessages(activeConversationId, [...updatedMessages, { ...assistantMessage, content: responseText }]);
            }
            if (soundEnabled && audioRef.current) audioRef.current.play().catch(()=>{});

        } catch (error: any) {
             if (error.name !== 'AbortError') {
                 console.error(error);
             }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleSendAnalysis = async (category: AnalysisCategory, task: Task, params: Record<string, any>, image?: { file: File; dataUrl: string }) => {
        setActiveTool(null);
        if (!activeConversationId) await handleNewChat();
        
        let displayContent = `Yêu cầu phân tích: ${taskTitles[task]}`;
        if (task === 'profit-analysis') displayContent = `Phân tích Lợi nhuận cho sản phẩm "${params.productName}"`;
        else if (task === 'promo-price') displayContent = `Dự báo Khuyến mãi cho sản phẩm "${params.productName}"`;
        else if (task === 'group-price') displayContent = `Phân tích Đồng giá ${Number(params.flatPrice).toLocaleString('vi-VN')}đ`;
        else if (task === 'market-research') displayContent = `Nghiên cứu xu hướng thời trang: ${params.query}`;

        let calculatedResult: CalculatedResult | null = null;
        let aiPrompt = "";

        if (category === 'business-analysis') {
            if (task === 'profit-analysis') {
                calculatedResult = performProfitAnalysis(params);
                aiPrompt = `You are a senior business analyst for V64. Analyze the financial data provided below.

**FORMATTING RULES:**
- Output **ONLY MARKDOWN**.
- Use **Markdown Tables** for financial summaries.
- Use **Bold** for key metrics.
- Do NOT use JSON. Do NOT use code blocks.

**STRUCTURE:**
1. **Financial Summary** (Table)
2. **Quick Assessment** (2-3 sentences on performance & risks)
3. **Detailed Analysis** (Bullet points on Cost, Risks, Opportunities)
4. **Actionable Recommendations** (3 specific steps)

**INPUT DATA:**
${calculatedResult.summaryText}`;
            } else if (task === 'promo-price') {
                calculatedResult = performPromoAnalysis(params);
                aiPrompt = `Analyze this promotion scenario. Output MARKDOWN. Input Data: ${calculatedResult.summaryText}`;
            } else if (task === 'group-price') {
                calculatedResult = performGroupPriceAnalysis(params);
                aiPrompt = `Analyze this group pricing strategy. Output MARKDOWN. Input Data: ${calculatedResult.summaryText}`;
            }
        } else if (task === 'market-research') {
             const dnaContext = businessProfile?.brandDNA ? `BRAND DNA: ${JSON.stringify(businessProfile.brandDNA)}` : '';
             aiPrompt = buildAnalysisPrompt(task, params, dnaContext);
        } else if (task === 'content-generation') {
             // Handle generation from previous analysis
             const sourceData = params.sourceData as ChatMessage;
             let context = "";
             if (sourceData.competitorAnalysisData) context = `Competitor Data: ${JSON.stringify(sourceData.competitorAnalysisData)}`;
             if (sourceData.keywordAnalysisData) context = `Keyword Data: ${JSON.stringify(sourceData.keywordAnalysisData)}`;
             if (sourceData.collectionAnalysisData) context = `Collection Data: ${JSON.stringify(sourceData.collectionAnalysisData)}`;
             
             aiPrompt = `You are a Marketing Expert. Generate engaging content based on this analysis data: ${context}.
             Create: 
             1. 3 Catchy Headlines (TikTok/FB)
             2. 1 Short Video Script Idea
             3. 1 Facebook Caption with Call-to-Action`;
        }

        const userMsg: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: displayContent,
            task: task,
            analysisParams: params,
            image: image?.dataUrl,
            charts: calculatedResult?.charts,
            timestamp: Date.now()
        } as any;

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setIsLoading(true);

        const contextMessages = [...messages.slice(-5), { role: 'user', content: aiPrompt || `Perform task: ${task}` } as any];
        abortControllerRef.current = new AbortController();

        try {
            const stream = getChatResponseStream(contextMessages, abortControllerRef.current.signal, { task, useCreativePersona: task === 'market-research' });
            let responseText = '';
            const responseId = Date.now() + 1;
            
            setMessages(prev => [...prev, { id: responseId, role: 'model', content: '' }]);

            for await (const chunk of stream) {
                if (chunk.textChunk) {
                    responseText += chunk.textChunk;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last.id === responseId) last.content = responseText;
                        return newMsgs;
                    });
                }
            }
            
            if (activeConversationId) {
                await saveMessages(activeConversationId, [...updatedMessages, { id: responseId, role: 'model', content: responseText }]);
            }
            if (soundEnabled && audioRef.current) audioRef.current.play().catch(()=>{});

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'model', content: "Có lỗi khi phân tích." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerate = async (index: number) => {
        if (isLoading) return;
        
        const history = messages.slice(0, index);
        setMessages(history);
        
        setIsLoading(true);
        if (soundEnabled && typingAudioRef.current) typingAudioRef.current.play().catch(()=>{});

        const assistantMessageId = Date.now();
        const assistantMessage: ChatMessage = { id: assistantMessageId, role: 'model', content: '' };
        setMessages(prev => [...prev, assistantMessage]);

        abortControllerRef.current = new AbortController();

        try {
            const lastUserMsg = history[history.length - 1];
            const options: any = {};
            if (lastUserMsg && lastUserMsg.role === 'user') {
                 if (lastUserMsg.task) options.task = lastUserMsg.task;
                 if (lastUserMsg.task === 'market-research') options.useCreativePersona = true;
            }

            const stream = getChatResponseStream(history, abortControllerRef.current.signal, options);
            let responseText = '';

            for await (const chunk of stream) {
                if (chunk.textChunk) {
                    responseText += chunk.textChunk;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last.id === assistantMessageId) last.content = responseText;
                        return newMsgs;
                    });
                }
                if (chunk.sources) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last.id === assistantMessageId) last.sources = chunk.sources;
                        return newMsgs;
                    });
                }
            }
            
            if (activeConversationId) {
                await saveMessages(activeConversationId, [...history, { ...assistantMessage, content: responseText }]);
            }
            if (soundEnabled && audioRef.current) audioRef.current.play().catch(()=>{});

        } catch (error: any) {
             if (error.name !== 'AbortError') {
                 console.error(error);
             }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    // --- EFFECTS (Initialization) ---
    useEffect(() => {
        const init = async () => {
            const profile = await loadUserProfile();
            setUserProfile(profile);
            if (!profile.name) setShowOnboardingPrompt(true);

            const convos = await loadConversations();
            const metaArray = Object.values(convos).sort((a, b) => parseInt(b.id) - parseInt(a.id));
            setConversations(metaArray);
            
            const groups = await loadConversationGroups();
            setConversationGroups(groups);

            const busProfile = await loadBusinessProfile();
            setBusinessProfile(busProfile);
            setWatchlist(busProfile.watchlist || []);

            if (metaArray.length > 0) {
                setActiveConversationId(metaArray[0].id);
                const msgs = await loadMessages(metaArray[0].id);
                setMessages(processMessagesWithComponents(msgs, effectiveTheme));
            } else {
                handleNewChat();
            }
        };
        init();
        
        audioRef.current = new Audio(messageReceivedSound);
        typingAudioRef.current = new Audio(typingSound);
    }, [handleNewChat, effectiveTheme]);

    useEffect(() => {
        document.documentElement.className = theme === 'system' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
            : theme;
    }, [theme]);

    // --- RENDER ---
    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''} font-${font}`}>
             {/* Sidebar */}
             <div className={`fixed inset-y-0 left-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out bg-transparent border-r border-transparent w-72`}>
                <Sidebar
                    conversations={conversations}
                    conversationGroups={conversationGroups}
                    activeConversationId={activeConversationId}
                    onNewChat={handleNewChat}
                    onSelectConversation={handleSelectConversation}
                    onDeleteConversation={(id) => setDeleteConfirmation({type: 'convo', id})}
                    onRenameConversation={async (id, title) => {
                        await saveConversationMeta(id, { title });
                        setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
                    }}
                    onCreateGroup={async (name) => {
                        const grp = await createConversationGroup(name);
                        if(grp) setConversationGroups(prev => ({...prev, [grp.id]: grp}));
                    }}
                    onRenameGroup={async (id, name) => {
                        await renameConversationGroup(id, name);
                        setConversationGroups(prev => ({...prev, [id]: {...prev[id], name}}));
                    }}
                    onDeleteGroup={(id) => setDeleteConfirmation({type: 'group', id})}
                    onAssignConversationToGroup={async (cid, gid) => {
                        await assignConversationToGroup(cid, gid);
                        setConversations(prev => prev.map(c => c.id === cid ? { ...c, groupId: gid } : c));
                    }}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    activeView={activeView}
                    onViewChange={(v) => { setActiveView(v); setIsSidebarOpen(false); }}
                />
             </div>

             {/* Main Content */}
             <div className="flex-1 flex flex-col h-full relative w-full md:w-auto bg-transparent min-w-0">
                {/* Header */}
                <div className="h-16 mx-4 mt-3 px-4 flex items-center justify-between z-20 glass-panel rounded-2xl transition-all">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <MenuIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px] sm:max-w-md">
                                {activeView === 'chat' ? (conversations.find(c => c.id === activeConversationId)?.title || 'V64 Assistant') : 
                                activeView === 'products' ? 'Quản lý Sản phẩm' :
                                activeView === 'watchlist' ? 'Danh sách Theo dõi' : 'Báo cáo'}
                            </h2>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium hidden sm:block">
                                {activeView === 'chat' ? 'AI Strategy Assistant' : 'System Management'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setActiveView('products')} 
                            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                activeView === 'products' 
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                            title="Đi tới trang Quản lý Sản phẩm"
                        >
                            <ArchiveBoxIcon className="w-4 h-4" />
                            <span>Sản phẩm</span>
                        </button>
                        
                        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>

                        {activeView === 'chat' && messages.length > 0 && (
                            <>
                                <button onClick={() => setIsFindBarVisible(p => !p)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors" title="Tìm kiếm">
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </button>
                                <SourceFilterControl 
                                    sources={Array.from(new Set(messages.flatMap(m => m.sources || []).map(s => JSON.stringify(s)))).map(s => JSON.parse(s))}
                                    activeFilter={sourceFilter} 
                                    onFilterChange={setSourceFilter} 
                                />
                            </>
                        )}
                        <SettingsPopover 
                            theme={theme} setTheme={setTheme} 
                            font={font} setFont={setFont}
                            userProfile={userProfile} onUpdateProfile={(p) => { setUserProfile(p); saveUserProfile(p); }}
                            onForgetUser={() => { localStorage.clear(); window.location.reload(); }}
                            soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
                            onOpenWorkflow={() => setIsWorkflowOpen(true)}
                            onOpenTestingGuide={() => setIsTestingGuideOpen(true)}
                            onOpenBusinessProfile={() => setIsBusinessProfileOpen(true)}
                            onNavigateToProducts={() => setActiveView('products')}
                        />
                    </div>
                </div>
                
                {/* Find Bar Overlay */}
                <FindBar isVisible={isFindBarVisible} onClose={() => setIsFindBarVisible(false)} containerRef={chatWindowRef} />

                {/* Content Area - Adjusted padding for floating header */}
                <div className="flex-1 flex flex-col overflow-hidden pt-4 pb-2 px-2">
                    {activeView === 'chat' && (
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            {comparisonSelection.length > 0 && (
                                <ComparisonToolbar 
                                    selection={comparisonSelection} 
                                    messages={messages} 
                                    onCompare={() => setIsSourceComparisonOpen(true)} 
                                    onClear={() => setComparisonSelection([])} 
                                />
                            )}
                            
                            {messages.length === 0 ? (
                                <Welcome 
                                    onSuggestionClick={handleSendMessage} 
                                    onToolSelect={(task) => {
                                        let cat: AnalysisCategory = 'business-analysis';
                                        if (['market-research', 'competitor-analysis', 'keyword-analysis', 'collection-analysis'].includes(task)) cat = 'market-research';
                                        if (task === 'brand-positioning') cat = 'brand-positioning';
                                        setActiveTool({ category: cat, initialTask: task });
                                    }}
                                    onNavigateToProducts={() => setActiveView('products')}
                                />
                            ) : (
                                <ChatWindow 
                                    ref={chatWindowRef}
                                    messages={messages.filter(m => !sourceFilter || m.sources?.some(s => s.uri === sourceFilter))} 
                                    isLoading={isLoading} 
                                    onSuggestionClick={handleSendMessage}
                                    onFeedback={(idx, fb) => {
                                        const newMsgs = [...messages];
                                        if(newMsgs[idx]) newMsgs[idx].feedback = { rating: 5, issues: [] };
                                        setMessages(newMsgs);
                                    }}
                                    onOpenFeedbackDialog={(msg, idx) => {
                                        setFeedbackDialogState({isOpen: true, message: msg, index: idx});
                                    }}
                                    onRegenerate={handleRegenerate}
                                    onRefine={() => { setInput("Dựa trên câu trả lời trên: "); setShouldFocusInput(true); }}
                                    comparisonSelection={comparisonSelection}
                                    onToggleCompare={(idx) => {
                                        setComparisonSelection(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : prev.length < 2 ? [...prev, idx] : [prev[1], idx]);
                                    }}
                                    onEditAnalysis={(msg) => setActiveTool({ category: 'business-analysis', initialTask: msg.task, initialData: msg.analysisParams })}
                                    onExportExcel={() => setIsExportOpen(true)}
                                    onQuickAction={(task, data) => setActiveTool({ category: 'business-analysis', initialTask: task, initialData: data })}
                                    sourceFilter={sourceFilter}
                                    effectiveTheme={effectiveTheme}
                                    onSourceFilterChange={setSourceFilter}
                                    editingMessageId={editingMessageId}
                                    onInitiateEdit={setEditingMessageId}
                                    onSaveEdit={handleSaveEdit}
                                    onCancelEdit={() => setEditingMessageId(null)}
                                    watchlist={watchlist}
                                    onToggleWatch={handleAddToWatchlist}
                                    onGenerateContent={(msg) => handleSendMessage(`Tạo nội dung marketing dựa trên:\n${msg.content}`)}
                                />
                            )}
                            
                            <MessageInput 
                                input={input} 
                                setInput={setInput} 
                                onSendMessage={handleSendMessage} 
                                onSendAnalysis={handleSendAnalysis} 
                                isLoading={isLoading} 
                                onNewChat={handleNewChat}
                                onClearChat={() => { setMessages([]); if(activeConversationId) saveMessages(activeConversationId, []); }}
                                onExportChat={() => setIsExportOpen(true)}
                                activeTool={activeTool}
                                setActiveTool={setActiveTool}
                                onStopGeneration={handleStopGeneration}
                                businessProfile={businessProfile}
                                shouldFocusInput={shouldFocusInput}
                                setShouldFocusInput={setShouldFocusInput}
                            />
                        </div>
                    )}

                    {activeView === 'products' && (
                        <div className="flex-1 rounded-2xl overflow-hidden glass-panel m-2">
                            <ProductCatalog 
                                profile={businessProfile} 
                                onSave={(p) => { setBusinessProfile(p); saveBusinessProfile(p); }}
                                onBack={() => setActiveView('chat')} 
                            />
                        </div>
                    )}
                    
                    {activeView === 'watchlist' && (
                        <div className="flex-1 rounded-2xl overflow-hidden glass-panel m-2">
                            <Watchlist 
                                watchlist={watchlist} 
                                onUpdate={handleUpdateWatchlistItem}
                                onRemove={handleRemoveFromWatchlist}
                                onUpdateAll={handleUpdateAllWatchlist}
                            />
                        </div>
                    )}

                    {activeView === 'report' && (
                        <div className="flex-1 rounded-2xl overflow-hidden glass-panel m-2">
                            <LookerStudioReport />
                        </div>
                    )}
                </div>
             </div>

            {/* Dialogs */}
            {feedbackDialogState.isOpen && feedbackDialogState.message && (
                <FeedbackDialog 
                    isOpen={feedbackDialogState.isOpen} 
                    onClose={() => setFeedbackDialogState({ isOpen: false, message: null, index: -1 })} 
                    message={feedbackDialogState.message} 
                    onSave={(msg, fb) => handleFeedback(msg, fb)} 
                />
            )}
            
            {businessProfile && (
                <BusinessProfileDialog 
                    isOpen={isBusinessProfileOpen} 
                    onClose={() => setIsBusinessProfileOpen(false)} 
                    profile={businessProfile} 
                    onSave={(p) => { setBusinessProfile(p); saveBusinessProfile(p); }} 
                />
            )}

            <WorkflowDialog isOpen={isWorkflowOpen} onClose={() => setIsWorkflowOpen(false)} />
            <TestingGuideDialog isOpen={isTestingGuideOpen} onClose={() => setIsTestingGuideOpen(false)} />
            
            {showOnboardingPrompt && (
                <OnboardingPrompt 
                    onConfirm={() => { setShowOnboardingPrompt(false); setIsOnboardingOpen(true); }} 
                    onDecline={() => setShowOnboardingPrompt(false)} 
                />
            )}
            <OnboardingDialog isOpen={isOnboardingOpen} onClose={() => { setIsOnboardingOpen(false); setTourOpen(true); }} />
            
            <GuidedTour isOpen={tourOpen} onClose={() => setTourOpen(false)} steps={tourSteps} />

            <CompetitorSelectionDialog 
                isOpen={showCompetitorDialog} 
                onClose={() => setShowCompetitorDialog(false)} 
                initialUrl={competitorUrl} 
                onConfirm={(products) => {
                    products.forEach(p => handleAddToWatchlist(p));
                    setShowCompetitorDialog(false);
                }} 
            />
            
             {isSourceComparisonOpen && comparisonSelection.length === 2 && (
                <SourceComparisonDialog 
                    isOpen={isSourceComparisonOpen} 
                    onClose={() => setIsSourceComparisonOpen(false)} 
                    message1={messages[comparisonSelection[0]]} 
                    message2={messages[comparisonSelection[1]]} 
                />
            )}
            
            <ExportDialog 
                isOpen={isExportOpen} 
                onClose={() => setIsExportOpen(false)} 
                onExportPng={() => handleExportChat('png')} 
                onExportTxt={() => handleExportChat('txt')} 
                isExporting={isExporting} 
            />
            
            <ConfirmationDialog
                isOpen={!!deleteConfirmation}
                title={deleteConfirmation?.type === 'convo' ? "Xóa cuộc trò chuyện?" : "Xóa nhóm?"}
                message="Hành động này không thể hoàn tác."
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={() => {
                    if(deleteConfirmation?.type === 'convo') {
                        deleteConversation(deleteConfirmation.id).then(() => {
                            setConversations(prev => prev.filter(c => c.id !== deleteConfirmation.id));
                            if(activeConversationId === deleteConfirmation.id) handleNewChat();
                        });
                    } else if (deleteConfirmation?.type === 'group') {
                        deleteConversationGroup(deleteConfirmation.id).then(() => {
                            loadConversationGroups().then(setConversationGroups);
                        });
                    }
                    setDeleteConfirmation(null);
                }}
            />

        </div>
    );
};
