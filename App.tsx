
// NOTE FOR DEVELOPER:
// This application runs entirely in the browser and connects directly to the Google Gemini API.
// To make it work, you need to ensure the Gemini API key is correctly configured in the execution environment.
// The backend-dependent code has been removed to resolve "Failed to fetch" errors.

// FIX: Import React hooks (useState, useMemo, useCallback, useRef, useEffect) to resolve 'Cannot find name' errors.
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
// FIX: Removed unused 'summarizeTitle' import as it is no longer exported from geminiService.
import { getChatResponseStream, createFineTuningExampleFromCorrection, translateText } from './services/geminiService';
import * as apiService from './services/apiService';
import type { ChatMessage, UserProfile, Theme, Font, ConversationMeta, Task, ConversationGroup, BusinessProfile, FineTuningExample, Feedback } from './types';
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
import { SourceFilterControl } from './components/SourceFilterControl';
import { FindBar } from './components/FindBar';
import { MagnifyingGlassIcon } from './components/icons/MagnifyingGlassIcon';
import { BusinessProfileDialog } from './components/BusinessProfileDialog';
import { FeedbackDialog } from './components/FeedbackDialog';
import { DotsVerticalIcon } from './components/icons/DotsVerticalIcon';
import { ProductCatalog } from './components/ProductCatalog';
import { BrandPositioningMap } from './components/BrandPositioningMap';


const THEME_KEY = 'theme';
const FONT_KEY = 'font';
const SOUND_ENABLED_KEY = 'soundEnabled';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId'; // Still needed for session resume

const generateSummaryForTask = (task: Task, params: any): string => {
    switch (task) {
        case 'profit-analysis':
            return `Phân tích Lợi nhuận: ${params.productName}`;
        case 'promo-price':
            return `Phân tích KM: ${params.productName}`;
        case 'group-price':
            const price = Number(params.flatPrice).toLocaleString('vi-VN');
            return `Phân tích Đồng giá: ${price} VND`;
        case 'market-research':
            const markets = Array.isArray(params.markets) ? ` (${params.markets.slice(0, 2).join(', ')})` : '';
            return `Nghiên cứu: ${params.style_keywords}${markets}`;
        case 'brand-positioning':
            return `Phân tích Định vị Thương hiệu`;
        default:
            return "Yêu cầu phân tích tùy chỉnh.";
    }
}

/**
 * Attempts to parse a JSON string, and if it fails, tries to fix common issues
 * in the 'analysis' field (unescaped quotes/newlines) before trying again.
 * @param jsonString The potentially malformed JSON string.
 * @param originalText The original full text from the AI, used as a fallback.
 * @returns A parsed JSON object or a fallback object.
 */
const fixAndParseJson = (jsonString: string, originalText: string): any => {
    try {
        // First attempt to parse the string as-is.
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn("Initial JSON parse failed. Attempting to repair.", e);

        // Attempt to repair the 'analysis' field for simpler JSON tasks
        try {
            const analysisKey = '"analysis":';
            const keyIndex = jsonString.indexOf(analysisKey);

            // If the key we need for repair isn't present, this specific repair method is not applicable.
            // Fallback to raw text without throwing an error to avoid confusing console messages.
            if (keyIndex === -1) {
                console.warn("JSON repair skipped: Could not find 'analysis' key. Falling back to raw text.");
                return { analysis: originalText, charts: [], sources: [] };
            }

            const valueStartIndex = jsonString.indexOf('"', keyIndex + analysisKey.length);
            if (valueStartIndex === -1) {
                throw new Error("Malformed 'analysis' value (missing opening quote).");
            }

            const prefix = jsonString.substring(0, valueStartIndex + 1);
            const rest = jsonString.substring(valueStartIndex + 1);

            const contentEndIndex = rest.lastIndexOf('"');
            if (contentEndIndex === -1) {
                throw new Error("Malformed 'analysis' value (missing closing quote).");
            }
            
            const content = rest.substring(0, contentEndIndex);
            const suffix = rest.substring(contentEndIndex);

            const fixedContent = content
                .replace(/\\/g, '\\\\') // 1. Escape existing backslashes
                .replace(/"/g, '\\"')   // 2. Escape double quotes
                .replace(/\n/g, '\\n'); // 3. Escape newlines

            const fixedJsonString = prefix + fixedContent + suffix;
            
            const parsed = JSON.parse(fixedJsonString);
            console.log("Successfully parsed JSON after repair.");
            return parsed;
        } catch (repairError: any) {
            console.error(`JSON repair attempt failed: ${repairError.message}. Falling back to raw text.`);
            return { analysis: originalText, charts: [], sources: [] };
        }
    }
};

// Centralized prompt generation
const generatePromptForTask = (task: Task, params: any): string => {
    const jsonInstruction = `

**YÊU CẦU ĐỊNH DẠNG ĐẦU RA (CỰC KỲ QUAN TRỌNG):**
Toàn bộ phản hồi của bạn **BẮT BUỘC** phải là một khối mã JSON duy nhất, hợp lệ (sử dụng \`\`\`json). Không được có bất kỳ văn bản nào bên ngoài khối mã này. JSON phải có cấu trúc như sau:
{
  "analysis": "...",
  "charts": [
    {
      "type": "bar",
      "title": "Tiêu đề của biểu đồ",
      "unit": "VND",
      "data": [
        { "name": "Tên cột 1", "value": 12345 },
        { "name": "Tên cột 2", "value": 67890 }
      ]
    }
  ]
}

**QUY TẮC CHO TRƯỜNG "charts":**
1.  "charts" **PHẢI** là một mảng (array) các đối tượng biểu đồ.
2.  Mỗi đối tượng biểu đồ **PHẢI** có các trường: "type", "title", "data", và "unit".
3.  Trường "type" **BẮT BUỘC PHẢI** có giá trị là "bar". Không được sử dụng bất kỳ giá trị nào khác.
4.  Trường "data" **BẮT BUỘC PHẢI** là một mảng (array) các đối tượng có dạng \`{ "name": "string", "value": number }\`.
5.  Trường "unit" **PHẢI** là chuỗi chỉ định đơn vị (ví dụ: "VND", "%"). Nếu không có đơn vị, để trống (\`"unit": ""\`).

**QUY TẮC CHO TRƯỜNG "analysis" (TUYỆT ĐỐI PHẢI TUÂN THỦ):**
1.  Giá trị của trường "analysis" **PHẢI** là một chuỗi (string) JSON hợp lệ.
2.  Tất cả các ký tự xuống dòng **BẮT BUỘC** phải được thay thế bằng \`\\n\`.
3.  Tất cả các dấu nháy kép (") **BẮT BUỘC** phải được escape bằng \`\\"\`.
`;

    switch (task) {
        case 'profit-analysis': {
            const { calculationTarget, period, productName, cost, variableCost, fixedCost, sellingPrice, salesVolume, targetProfit, targetProfitPercent, competitors } = params;
            const periodText = period === 'monthly' ? 'THÁNG' : 'NĂM';
            let targetText = '';
            switch (calculationTarget) {
                case 'sellingPrice': targetText = 'GIÁ BÁN CẦN THIẾT'; break;
                case 'salesVolume': targetText = 'DOANH SỐ CẦN THIẾT'; break;
                case 'profit': targetText = 'LỢI NHUẬN TIỀM NĂNG'; break;
            }

            let prompt = `Thực hiện phân tích lợi nhuận cho sản phẩm "${productName}".\n\n`;
            prompt += `**Kế hoạch:**\n- Kỳ: ${periodText}\n- Mục tiêu: **${targetText}**\n\n`;
            prompt += `**Dữ liệu:**\n- Giá vốn/sp: ${cost} VND\n- Chi phí biến đổi/sp: ${variableCost} VND\n- Tổng chi phí cố định: ${fixedCost} VND\n`;

            if (calculationTarget !== 'sellingPrice') prompt += `- Giá bán dự kiến/sp: ${sellingPrice} VND\n`;
            if (calculationTarget !== 'salesVolume') prompt += `- Doanh số dự kiến: ${salesVolume} sp\n`;
            if (calculationTarget !== 'profit') {
                if(params.profitTargetType === 'percent') {
                    prompt += `- Lợi nhuận mục tiêu: ${targetProfitPercent}% trên Tổng Chi phí.\n`;
                } else {
                    prompt += `- Lợi nhuận mục tiêu: ${targetProfit} VND\n`;
                }
            }
            
            if (competitors) {
                const competitorList = competitors.replace(/\n/g, ', ');
                const priceToCompare = calculationTarget === 'sellingPrice' ? 'Giá bán mục tiêu' : 'Giá bán dự kiến';
                prompt += `\n**Yêu cầu thị trường:**\n- **Sử dụng Google Search**, tra cứu giá bán "${productName}" từ các đối thủ: ${competitorList}.\n- Thêm mục **"Phân tích Cạnh tranh"** để so sánh **${priceToCompare}** với giá thị trường.\n- Thêm biểu đồ cột so sánh **${priceToCompare}** với giá trung bình của từng đối thủ.\n\n`;
            }
            
            prompt += `**Yêu cầu phân tích:**\n1. Công thức tính.\n2. Kết quả tính toán.\n3. Phân tích Điểm hòa vốn.\n4. Đánh giá & Lời khuyên.`;
            
            prompt += jsonInstruction;
            return prompt;
        }
        case 'promo-price': {
            const { productName, originalPrice, cost, currentSales, discount, promoGoal, competitors } = params;
            const newPrice = Number(originalPrice) * (1 - Number(discount) / 100);
            let prompt = `Phân tích hiệu quả khuyến mãi.\n\n**Dữ liệu:**\n- Sản phẩm: "${productName}"\n- Giá gốc: ${originalPrice} VND\n- Giá vốn: ${cost} VND\n- Doanh số/tháng: ${currentSales} sp\n- Giảm giá: **${discount}%** (giá mới ${newPrice.toLocaleString('vi-VN')} VND)\n- Mục tiêu: **${promoGoal === 'profit' ? 'Tối đa hóa Lợi nhuận' : 'Tối đa hóa Doanh thu'}**\n\n`;
            
            if (competitors) {
                prompt += `**Yêu cầu thị trường:**\n- **Sử dụng Google Search**, tra cứu giá "${productName}" từ các đối thủ: ${competitors.replace(/\n/g, ', ')}.\n- Thêm mục **"Phân tích Cạnh tranh"** để so sánh giá khuyến mãi với giá thị trường.\n- Thêm biểu đồ cột so sánh giá khuyến mãi với giá của đối thủ.\n\n`;
            }

            prompt += `**Yêu cầu phân tích:**\n1. **DỰ BÁO TĂNG TRƯỞNG DOANH SỐ:** Ước tính tỷ lệ tăng trưởng doanh số hợp lý dựa trên mức giảm giá.\n2. **PHÂN TÍCH SO SÁNH:** So sánh "Trước" và "Sau" khuyến mãi về Doanh thu, Lợi nhuận.\n3. **KẾT LUẬN & ĐỀ XUẤT:** Có nên thực hiện chiến dịch này không?`;

            prompt += jsonInstruction;
            return prompt;
        }
        case 'group-price': {
             const { products, flatPrice, salesIncrease, competitors } = params;
            const productListString = products.map((p: any) => `${p.name || 'Sản phẩm không tên'} | ${p.cost || 0} | ${p.originalPrice || 0} | ${p.currentSales || 0}`).join('\n');
            
            let prompt = `Phân tích chính sách bán đồng giá.\n\n**Sản phẩm & Dữ liệu:**\n(Tên | Giá vốn | Giá gốc | Doanh số/tháng)\n${productListString}\n\n`;
            prompt += `**Kịch bản:**\n- Giá đồng giá: ${flatPrice} VND\n- Tăng trưởng doanh số kỳ vọng/sp: ${salesIncrease}%\n\n`;
            
            if (competitors) {
                prompt += `**Yêu cầu thị trường:**\n- **Sử dụng Google Search**, tra cứu giá các sản phẩm tương tự từ đối thủ: ${competitors.replace(/\n/g, ', ')}.\n- Thêm mục **"Phân tích Cạnh tranh"** để so sánh mức giá đồng giá với giá thị trường.\n- Thêm biểu đồ so sánh giá đồng giá với giá của đối thủ.\n\n`;
            }
            
            prompt += `**Yêu cầu phân tích:**\n1. So sánh tổng doanh thu và lợi nhuận của cả nhóm giữa "Hiện tại" và "Đồng giá".\n2. Phân tích thay đổi lợi nhuận cho từng sản phẩm.\n3. Kết luận và lời khuyên.`;
            
            prompt += jsonInstruction;
            return prompt;
        }
        case 'market-research': {
            const { season, year, style_keywords, target_audience, markets } = params;
            const seasonText = season === 'spring-summer' ? 'Xuân/Hè' : 'Thu/Đông';
            const marketsText = Array.isArray(markets) ? markets.join(', ') : markets;

            let prompt = `Bạn là chuyên gia phân tích thời trang và thị trường denim toàn cầu.

**Bối cảnh:**
- **Thương hiệu:** V64 (thương hiệu denim Việt Nam, phong cách thanh lịch, tối giản, năng động cho người trẻ văn phòng).
- **Mùa:** ${seasonText} ${year}
- **Chủ đề:** ${style_keywords}
- **Đối tượng:** ${target_audience}
- **Thị trường tham chiếu:** ${marketsText}

**Nhiệm vụ:**
1. **Sử dụng Google Search**, phân tích thị trường, xu hướng, nguyên vật liệu, công nghệ và khả thi sản xuất cho thương hiệu denim V64 dựa trên bối cảnh trên.
2. Đầu ra **BẮT BUỘC** phải là một bảng Markdown rõ ràng, gồm 3 phần chính.
3. Mỗi phần gồm các cột: **Keyword | Mô tả tóm tắt | Insight chính | Mức độ ảnh hưởng (1–5)**

**Yêu cầu:**
- Chỉ chọn từ khóa (keyword) có liên quan đến denim, xu hướng văn phòng, hoặc nguyên liệu thân thiện môi trường.
- Tự động chuẩn hóa tên (ví dụ: “liquid denim”, “comfort-stretch”, “barrel-leg”, “soft tailoring”).
- Viết bằng **tiếng Việt**, giữ nguyên thuật ngữ kỹ thuật bằng **tiếng Anh** nếu phổ biến trong ngành.
- Ưu tiên dựa theo các nguồn uy tín trên toàn cầu và các thị trường tham chiếu đã thiết lập.

**Định dạng đầu ra (Bắt buộc là bảng Markdown):**

| Nhóm | Keyword | Mô tả tóm tắt | Insight chính | Mức độ ảnh hưởng (1–5) |
|------|----------|----------------|----------------|----------------|
| Phân tích thị trường & xu hướng | ... | ... | ... | ... |
| Nghiên cứu nguyên vật liệu & công nghệ | ... | ... | ... | ... |
| Đánh giá tính khả thi | ... | ... | ... | ... |
`;
            return prompt;
        }
        case 'brand-positioning': {
            // FIX: This prompt is now the core of the enhanced brand positioning analysis.
            const brandData = `
            - **Vị trí của V-SIXTYFOUR:** Nằm ở góc phần tư "Thời trang" (Fashion) và "Giá vừa phải" (Mid-Price).
            - **Đối thủ cùng phân khúc:** ZARA, Levi's, Lee, Calvin Klein Jeans.
            - **Đối thủ cao cấp hơn:** GUESS, VERSACE, GUCCI, LOUIS VUITTON, DSQUARED2, DIESEL (phân khúc "Giá cao" - "Thời trang").
            - **Đối thủ giá thấp hơn / cơ bản hơn:** YODY, MUJI, UNIQLO (phân khúc "Cơ bản" - "Giá thấp/vừa phải"), ROUTINE, GENVIET, #icon denim, PT2000 (phân khúc "Thời trang" - "Giá thấp").
            `;
             let prompt = `**YÊU CẦU:** Với vai trò là một nhà chiến lược kinh doanh, hãy phân tích sơ đồ định vị thương hiệu của V-SIXTYFOUR. **Sử dụng Google Search** để tra cứu thông tin và chiến lược hiện tại của các đối thủ chính (Uniqlo, ZARA, Routine, Levi's) để làm cho phân tích thêm sắc bén.\n\n`;
             prompt += `**DỮ LIỆU SƠ ĐỒ:**\n${brandData}\n\n`;
             prompt += `**NỘI DUNG PHÂN TÍCH (BẮT BUỘC):**
1.  **Phân tích SWOT cho V-SIXTYFOUR:**
    *   **Điểm mạnh (Strengths):** Dựa vào vị trí hiện tại trên sơ đồ.
    *   **Điểm yếu (Weaknesses):** Dựa vào vị trí hiện tại và các đối thủ xung quanh.
    *   **Cơ hội (Opportunities):** Các khoảng trống thị trường hoặc hướng phát triển tiềm năng.
    *   **Thách thức (Threats):** Áp lực cạnh tranh từ các nhóm đối thủ.
2.  **Đề xuất Chiến lược (2-3 đề xuất):**
    *   Đưa ra các hành động cụ thể, có tính thực thi cao để V-SIXTYFOUR củng cố vị thế và phát triển.`;
            return prompt;
        }
        default:
            return '';
    }
};


const App: React.FC = () => {
  const [conversations, setConversations] = useState<Record<string, ConversationMeta>>({});
  const [conversationGroups, setConversationGroups] = useState<Record<string, ConversationGroup>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationMessages, setActiveConversationMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<{ action: 'clear' | 'delete' | 'delete-group'; id?: string } | null>(null);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isTestingGuideOpen, setIsTestingGuideOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'products'>('chat');
  const [activeTool, setActiveTool] = useState<{ task: Task; initialData?: Record<string, any>; businessProfile: BusinessProfile | null } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isBusinessProfileOpen, setIsBusinessProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [comparisonSelection, setComparisonSelection] = useState<number[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const pendingAnalysisParamsRef = useRef<{ params: any; task: Task } | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [isFindVisible, setIsFindVisible] = useState(false);
  const [fineTuningExamples, setFineTuningExamples] = useState<FineTuningExample[]>([]);
  const [feedbackDialogData, setFeedbackDialogData] = useState<{ message: ChatMessage; index: number } | null>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);


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
    const handleClickOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            const [profile, busProfile, loadedConversations, loadedGroups, loadedExamples] = await Promise.all([
                apiService.loadUserProfile(),
                apiService.loadBusinessProfile(),
                apiService.loadConversations(),
                apiService.loadConversationGroups(),
                apiService.loadFineTuningExamples(),
            ]);
            
            setUserProfile(profile);
            setBusinessProfile(busProfile);
            setConversationGroups(loadedGroups);
            setFineTuningExamples(loadedExamples);

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
          
          const processedMessages = messages.map(msg => {
            if (msg.role === 'model' && msg.task) {
                let component = null;
                 if (msg.task === 'brand-positioning') {
                    // For brand positioning, the component is now part of a combined message
                    component = <BrandPositioningMap />;
                } else if (msg.charts && Array.isArray(msg.charts)) {
                    component = (
                        <div>
                          {msg.charts.map((chart: any, index: number) => (
                            <AnalysisChart key={index} chart={chart} theme={effectiveTheme} />
                          ))}
                        </div>
                    );
                }
                return { ...msg, component };
            }
            return msg;
          });
          
          setActiveConversationMessages(processedMessages);
          setComparisonSelection([]);
          setSourceFilter(null);
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
  }, [activeConversationId, effectiveTheme]);
  
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
      }
  }, [conversations]);
  
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const sendMessage = useCallback(async (userInput: string, image?: { file: File; dataUrl: string }, analysisPayload?: { params: any; task: Task }, regenerateMessageIndex?: number) => {
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

    let initialMessages: ChatMessage[];
    if (typeof regenerateMessageIndex === 'number') {
        initialMessages = activeConversationMessages.slice(0, regenerateMessageIndex - 1);
    } else {
        initialMessages = [...activeConversationMessages];
    }

    if (initialMessages.length > 0) {
        const lastMsg = initialMessages[initialMessages.length - 1];
        if (lastMsg.role === 'model' && lastMsg.suggestions) {
            const { suggestions, ...rest } = lastMsg;
            initialMessages[initialMessages.length - 1] = rest;
        }
    }
    
    let userMessage: ChatMessage | null = null;
    let titleSource = userInput;

    if (analysisPayload) {
        const summary = generateSummaryForTask(analysisPayload.task, analysisPayload.params);
        userMessage = { role: 'user' as const, content: summary };
        titleSource = summary;
    } else if (userInput || image) {
        if (typeof regenerateMessageIndex === 'undefined') {
            userMessage = { 
                role: 'user' as const, 
                content: userInput,
                ...(image && { image: image.dataUrl }),
            };
        }
    } else {
        return; // Nothing to send
    }
    
    setComparisonSelection([]);
    setSourceFilter(null);
    setIsLoading(true);
    setActiveTool(null);
    setIsSidebarOpen(false);

    playSound(typingAudio);

    const displayMessages = typeof regenerateMessageIndex === 'number'
        ? activeConversationMessages.slice(0, regenerateMessageIndex)
        : (userMessage ? [...initialMessages, userMessage] : initialMessages);

    const placeholderMessage: ChatMessage = { role: 'model', content: '' };
    setActiveConversationMessages([...displayMessages, placeholderMessage]);
    
    abortControllerRef.current = new AbortController();
    
    try {
      let finalContent = '';
      let finalSources: ChatMessage['sources'] = [];
      let finalPerformance: ChatMessage['performance'] | undefined = undefined;
      let finalError: string | undefined = undefined;
      
      const messagesForApi = userMessage ? [...initialMessages, userMessage] : [...initialMessages];
        
      let fullPrompt = userInput;
      if (analysisPayload) {
          fullPrompt = generatePromptForTask(analysisPayload.task, analysisPayload.params);
      }
      const finalApiHistory = [...messagesForApi.slice(0, -1), { role: 'user' as const, content: fullPrompt, image: image?.dataUrl }];
      
      const stream = getChatResponseStream(finalApiHistory, abortControllerRef.current.signal, { task: analysisPayload?.task, useCreativePersona: analysisPayload?.task === 'market-research' });
      for await (const chunk of stream) {
          if (chunk.textChunk) finalContent += chunk.textChunk;
          if (chunk.isFinal) {
              finalSources = chunk.sources || [];
              finalPerformance = chunk.performanceMetrics;
              finalError = chunk.error;
              break;
          }
      }

      // --- Final Processing ---
      let contentToProcess = finalError || finalContent;
      let isTranslated = false;
      let originalContent = '';
      
      let parsedData: any = null;
      let finalComponent: React.ReactNode | undefined = undefined;
      let finalCharts: any[] | undefined = undefined;

      const isJsonTask = !!analysisPayload && analysisPayload.task !== 'market-research' && analysisPayload.task !== 'brand-positioning';
      const task = analysisPayload?.task;

      if (isJsonTask && !finalError && contentToProcess) {
        let jsonString = contentToProcess.trim();
        const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        jsonString = match?.[1]?.trim() ?? jsonString;
        
        parsedData = fixAndParseJson(jsonString, contentToProcess);

        if (Array.isArray(parsedData.charts)) {
            finalComponent = <div>{parsedData.charts.map((chart: any, i: number) => <AnalysisChart key={i} chart={chart} theme={effectiveTheme} />)}</div>;
            contentToProcess = parsedData.analysis || '';
            finalCharts = parsedData.charts;
        }
      } else if (task === 'brand-positioning') {
            finalComponent = <BrandPositioningMap />;
      }
      
      const finalMessage: ChatMessage = {
          role: 'model',
          content: contentToProcess,
          sources: finalSources,
          performance: finalPerformance,
          isTranslated,
          originalContent: isTranslated ? originalContent : undefined,
          component: finalComponent,
          charts: finalCharts,
          ...(analysisPayload && { analysisParams: analysisPayload.params, task: analysisPayload.task }),
      };

      setActiveConversationMessages(prev => {
        const newMsgs = [...prev];
        const lastMsgIndex = newMsgs.length - 1;
        newMsgs[lastMsgIndex] = finalMessage;
        return newMsgs;
      });
      
      if (!finalError) playSound(messageAudio);

      const needsTitle = (initialMessages.length === 0) && conversations[currentConvoId]?.title === "Cuộc trò chuyện mới";
      if (needsTitle && !finalError && titleSource && currentConvoId) {
          const tempTitle = titleSource.length > 30 ? titleSource.substring(0, 30) + "..." : titleSource;
          handleRenameConversation(currentConvoId, tempTitle);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Stream failed:", error);
        const errorMessage = error.message || "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.";
        setActiveConversationMessages(prev => {
            const newMsgs = [...prev];
            const lastMsgIndex = newMsgs.length - 1;
            newMsgs[lastMsgIndex] = { ...newMsgs[lastMsgIndex], role: 'model', content: errorMessage };
            return newMsgs;
        });
      }
    } finally {
      setIsLoading(false);
      typingAudio.pause();
      abortControllerRef.current = null;
    }
  }, [activeConversationId, activeConversationMessages, handleRenameConversation, typingAudio, messageAudio, playSound, effectiveTheme, conversations]);

  const handleRegenerate = (index: number) => {
    if (isLoading || index === 0) return;
    const userMessage = activeConversationMessages[index - 1];
    if (userMessage.role === 'user') {
        sendMessage(userMessage.content, undefined, undefined, index);
    }
  };

  const handleClearChat = async (id: string) => {
    if (id === activeConversationId) {
        setActiveConversationMessages([]);
        setComparisonSelection([]);
        setSourceFilter(null);
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
  
  const handleFeedback = async (messageIndex: number, feedback: 'positive') => {
    const updatedMessages = [...activeConversationMessages];
    const messageToUpdate = updatedMessages[messageIndex];

    if (messageToUpdate && messageToUpdate.role === 'model') {
        updatedMessages[messageIndex] = { 
            ...messageToUpdate,
            role: 'model',
            feedback: { rating: 5, issues: [] }, // Simple positive feedback
        };
        setActiveConversationMessages(updatedMessages);
    }
  };

  const handleSaveFeedback = async (message: ChatMessage, feedbackData: Feedback, index: number) => {
    // Update the message in the UI to show feedback has been given
    setActiveConversationMessages(prev => prev.map((m, i) => 
      i === index ? { ...m, role: 'model', feedback: feedbackData } : m
    ));

    // If there's a correction, create a fine-tuning example in the background
    if (feedbackData.correction && feedbackData.correction.trim()) {
        let originalPrompt = "Không tìm thấy prompt gốc.";
        const messageIndex = index;
        if (messageIndex > -1) {
            for (let i = messageIndex - 1; i >= 0; i--) {
                if (activeConversationMessages[i].role === 'user') {
                    originalPrompt = activeConversationMessages[i].content;
                    break;
                }
            }
        }
        
        // Don't await, let it run in background
        createFineTuningExampleFromCorrection(originalPrompt, message.content, feedbackData.correction)
            .then(async (idealResponse) => {
                if (idealResponse) {
                    const newExample: FineTuningExample = {
                        id: `ft-explicit-${Date.now()}`,
                        originalPrompt,
                        improvedResponse: idealResponse,
                    };
                    await apiService.saveFineTuningExample(newExample);
                    const updatedExamples = await apiService.loadFineTuningExamples();
                    setFineTuningExamples(updatedExamples);
                    console.log("AI has learned from the explicit feedback.", newExample);
                }
            });
    }
    setFeedbackDialogData(null);
  };
  
  const handleProfileUpdate = async (profile: UserProfile) => {
    setUserProfile(profile);
    await apiService.saveUserProfile(profile);
  };

  const handleBusinessProfileSave = async (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    await apiService.saveBusinessProfile(profile);
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
        setActiveTool({ task: message.task, initialData: message.analysisParams, businessProfile });
        setIsSidebarOpen(false);
    }
  }, [businessProfile]);
  
  const handleExportPng = useCallback(async () => {
    if (!chatWindowRef.current) {
        alert('Không thể tìm thấy nội dung chat để xuất.');
        return;
    }
    setIsExporting(true);
    try {
        const dataUrl = await toPng(chatWindowRef.current, { 
            cacheBust: true, 
            backgroundColor: effectiveTheme === 'dark' ? '#0d1222' : '#f1f5f9', // slate-100
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

  const handleSendAnalysis = useCallback((task: Task, params: Record<string, any>) => {
    sendMessage('', undefined, { params, task });
  }, [sendMessage]);
  
  // --- Group Handlers ---
  const handleCreateGroup = async (name: string) => {
    const newGroup = await apiService.createConversationGroup(name);
    if (newGroup) {
      setConversationGroups(prev => ({ ...prev, [newGroup.id]: newGroup }));
    }
  };

  const handleRenameGroup = async (id: string, newName: string) => {
    setConversationGroups(prev => ({ ...prev, [id]: { ...prev[id], name: newName } }));
    await apiService.renameConversationGroup(id, newName);
  };

  const handleDeleteGroup = async (id: string) => {
    // Optimistically update UI
    const newGroups = { ...conversationGroups };
    delete newGroups[id];
    setConversationGroups(newGroups);
    
    const newConversations = { ...conversations };
    // FIX: Changed iteration logic from Object.values to Object.keys to correctly
    // modify the object properties and resolve the TypeScript error.
    Object.keys(newConversations).forEach(convoId => {
        if (newConversations[convoId].groupId === id) {
            newConversations[convoId].groupId = null;
        }
    });
    setConversations(newConversations);
    
    await apiService.deleteConversationGroup(id);
    setIsConfirmDialogOpen(null);
  };
  
  const handleAssignConversationToGroup = async (conversationId: string, groupId: string | null) => {
    setConversations(prev => ({
        ...prev,
        [conversationId]: { ...prev[conversationId], groupId: groupId }
    }));
    await apiService.assignConversationToGroup(conversationId, groupId);
  };

  const uniqueSources = useMemo(() => {
    const sourcesMap = new Map<string, string>();
    activeConversationMessages.forEach(msg => {
        if (msg.role === 'model' && msg.sources) {
            msg.sources.forEach(source => {
                if (!sourcesMap.has(source.uri)) {
                    sourcesMap.set(source.uri, source.title);
                }
            });
        }
    });
    return Array.from(sourcesMap, ([uri, title]) => ({ uri, title }));
  }, [activeConversationMessages]);

  const filteredMessages = useMemo(() => {
    if (!sourceFilter) {
        return activeConversationMessages;
    }

    const indicesToKeep = new Set<number>();
    
    activeConversationMessages.forEach((msg, index) => {
        if (msg.role === 'model' && msg.sources?.some(source => source.uri === sourceFilter)) {
            // Add the model message index
            indicesToKeep.add(index);
            // Look backward from the current model message to find the last user message
            for (let i = index - 1; i >= 0; i--) {
                if (activeConversationMessages[i].role === 'user') {
                    indicesToKeep.add(i);
                    break; // Found the user message, stop looking back
                }
            }
        }
    });

    return activeConversationMessages.filter((_, index) => indicesToKeep.has(index));
  }, [activeConversationMessages, sourceFilter]);

  const headerActionClass = "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"

  const handleViewChange = (view: 'chat' | 'products') => {
      setActiveView(view);
      setIsSidebarOpen(false);
  };

  return (
    <div className={`flex h-dvh bg-slate-100 dark:bg-[#0d1222] text-slate-800 dark:text-slate-200 transition-colors duration-300 font-sans`}>
        <Sidebar 
            conversations={Object.values(conversations)}
            conversationGroups={conversationGroups}
            activeConversationId={activeConversationId}
            onNewChat={() => handleNewChat()}
            onSelectConversation={(id) => setActiveConversationId(id)}
            onDeleteConversation={(id) => setIsConfirmDialogOpen({ action: 'delete', id })}
            onRenameConversation={handleRenameConversation}
            onCreateGroup={handleCreateGroup}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={(id) => setIsConfirmDialogOpen({ action: 'delete-group', id })}
            onAssignConversationToGroup={handleAssignConversationToGroup}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            activeView={activeView}
            onViewChange={handleViewChange}
        />
        
        <div className="flex flex-col flex-1 h-dvh relative">
            <header className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm shrink-0 z-10">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 md:hidden">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {activeView === 'products'
                            ? 'Danh mục Sản phẩm'
                            : (activeConversationId && conversations[activeConversationId]?.title) || 'Trợ lý Kinh doanh'
                        }
                    </h1>
                </div>

                <div className="flex items-center gap-1">
                    {activeView === 'chat' && uniqueSources.length > 0 && (
                        <SourceFilterControl
                            sources={uniqueSources}
                            activeFilter={sourceFilter}
                            onFilterChange={setSourceFilter}
                        />
                    )}
                     {activeView === 'chat' && (
                        <button onClick={() => setIsFindVisible(true)} className={headerActionClass} title="Tìm trong trang">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        </button>
                     )}
                    <button onClick={() => setIsExportDialogOpen(true)} disabled={activeView !== 'chat' || activeConversationMessages.length === 0} className={headerActionClass} title="Xuất cuộc trò chuyện">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    <div className="hidden sm:flex items-center gap-1">
                        <button onClick={() => setIsTestingGuideOpen(true)} className={headerActionClass} title="Hướng dẫn kiểm thử">
                            <CheckBadgeIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsWorkflowDialogOpen(true)} className={headerActionClass} title="Xem quy trình làm việc">
                            <WorkflowIcon className="w-5 h-5" />
                        </button>
                    </div>
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
                        onOpenBusinessProfile={() => setIsBusinessProfileOpen(true)}
                    />
                    <div className="relative sm:hidden" ref={headerMenuRef}>
                        <button onClick={() => setIsHeaderMenuOpen(p => !p)} className={headerActionClass}>
                            <DotsVerticalIcon className="w-5 h-5" />
                        </button>
                        {isHeaderMenuOpen && (
                             <div className="absolute top-full right-0 mt-2 w-48 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 z-10 animate-popover-enter">
                                <button onClick={() => { setIsWorkflowDialogOpen(true); setIsHeaderMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">
                                    <WorkflowIcon className="w-4 h-4" />
                                    <span>Quy trình</span>
                                </button>
                                <button onClick={() => { setIsTestingGuideOpen(true); setIsHeaderMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">
                                    <CheckBadgeIcon className="w-4 h-4" />
                                    <span>Kiểm thử</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            <FindBar 
                isVisible={isFindVisible}
                onClose={() => setIsFindVisible(false)}
                containerRef={chatWindowRef}
            />
            
            {activeView === 'products' ? (
                <ProductCatalog
                    profile={businessProfile}
                    onSave={handleBusinessProfileSave}
                />
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activeConversationMessages.length === 0 && !isLoading ? (
                        <Welcome onSuggestionClick={(prompt) => sendMessage(prompt)} onToolSelect={(task) => handleSendAnalysis(task, {})} />
                    ) : (
                        <ChatWindow 
                            ref={chatWindowRef}
                            messages={filteredMessages}
                            isLoading={isLoading}
                            onSuggestionClick={(prompt) => sendMessage(prompt)}
                            onFeedback={handleFeedback}
                            onOpenFeedbackDialog={(msg, index) => setFeedbackDialogData({ message: msg, index })}
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
                            onCompare={() => setIsComparisonOpen(true)}
                            onClear={handleClearCompare}
                        />
                    )}

                    <MessageInput 
                        onSendMessage={(prompt, image) => sendMessage(prompt, image)}
                        onSendAnalysis={handleSendAnalysis}
                        isLoading={isLoading}
                        onNewChat={() => handleNewChat()}
                        onClearChat={() => activeConversationId && setIsConfirmDialogOpen({ action: 'clear', id: activeConversationId })}
                        activeTool={activeTool}
                        setActiveTool={(tool) => setActiveTool(tool ? { ...tool, businessProfile } : null)}
                        onStopGeneration={handleStopGeneration}
                    />
                </div>
            )}
        </div>

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
        
        {businessProfile && (
            <BusinessProfileDialog
                isOpen={isBusinessProfileOpen}
                onClose={() => setIsBusinessProfileOpen(false)}
                profile={businessProfile}
                onSave={handleBusinessProfileSave}
            />
        )}

        {feedbackDialogData && (
            <FeedbackDialog
                isOpen={!!feedbackDialogData}
                onClose={() => setFeedbackDialogData(null)}
                message={feedbackDialogData.message}
                onSave={(msg, feedback) => handleSaveFeedback(msg, feedback, feedbackDialogData.index)}
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
                    } else if (isConfirmDialogOpen.action === 'delete-group' && isConfirmDialogOpen.id) {
                        handleDeleteGroup(isConfirmDialogOpen.id);
                    }
                }}
                title={
                    isConfirmDialogOpen.action === 'clear' ? "Xóa cuộc trò chuyện?" :
                    isConfirmDialogOpen.action === 'delete' ? "Xóa vĩnh viễn?" :
                    "Xóa nhóm này?"
                }
                message={
                    isConfirmDialogOpen.action === 'clear' 
                    ? "Bạn có chắc chắn muốn xóa tất cả tin nhắn trong cuộc trò chuyện này không? Hành động này không thể hoàn tác."
                    : isConfirmDialogOpen.action === 'delete'
                    ? "Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này không? Hành động này không thể hoàn tác."
                    : "Bạn có chắc chắn muốn xóa nhóm này không? Các cuộc trò chuyện bên trong sẽ không bị xóa."
                }
            />
        )}
    </div>
  );
};

export default App;