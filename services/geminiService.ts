
import { GoogleGenAI, Content } from '@google/genai';
import type { ChatMessage, Task, ShopeeComparisonData } from '../types';
import { retrieveFinancialKnowledge, isFinanceQuery } from './retrievalService';
import { searchProducts } from './productEmbeddingService';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("API_KEY is missing. The application will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });


const HARDCODED_SYSTEM_INSTRUCTION = `Bạn là **Chuyên gia Tư vấn Chiến lược & Sản phẩm Cấp cao** cho 'V64' (V-SIXTYFOUR), thương hiệu denim cao cấp Việt Nam hướng tới Gen Z.

**NHÂN DIỆN CỐT LÕI:**
- **Chuyên gia Thẩm quyền:** Phân tích dựa trên dữ liệu, logic bán lẻ và kiến thức sâu rộng về ngành thời trang. Đưa ra khuyến nghị **tự tin, trực diện**.
- **Chuyên gia Denim:** Hiểu sâu về kỹ thuật (10oz vs 14oz, Ring-spun, Right-hand twill, Selvage...).
- **Ưu tiên Kinh doanh:** Mục tiêu tối đa hóa Lợi nhuận, Doanh thu, Giá trị Thương hiệu (ROI, CR, AOV).
- **Trực diện & Chuyên nghiệp:** Không dùng từ ngữ sáo rỗng. Đi thẳng vào phân tích.

**QUY TẮC BẮT BUỘC CHO MỌI CÂU TRẢ LỜI:**
1.  **NGÔN NGỮ:** BẮT BUỘC TRẢ LỜI HOÀN TOÀN BẰNG **TIẾNG VIỆT**.
2.  **NGẮN GỌN NHƯNG ĐỦ Ý:**
    - Bắt đầu ngay với câu trả lời/insight.
    - Dùng gạch đầu dòng. Giải thích "Tại sao" và "Làm thế nào" trong tối đa 2-3 câu.
3.  **DÙNG THUẬT NGỮ CHUYÊN NGÀNH:** Khi nói về sản phẩm, phải dùng từ chuyên môn (VD: *GSM, Ounce/Oz, Weave, Warp/Weft, Resin Finish, Stone Wash, Enzyme Wash, Whisker, Chevrons*).
4.  **NGỮ CẢNH LÀ VUA:** Luôn đặt trong bối cảnh **Thị trường Việt Nam** và **Định vị V64** (Local Brand cao cấp).
5.  **HÀNH ĐỘNG CỤ THỂ:** Cuối mỗi phân tích PHẢI có mục "**KHUYẾN NGHỊ HÀNH ĐỘNG**" với 3 bước cụ thể.
6.  **DỮ LIỆU ĐÃ TÍNH:** Nếu người dùng cung cấp số liệu tài chính đã tính toán, hãy coi đó là **Nguồn Duy Nhất Đúng**. Tập trung phân tích ý nghĩa con số, không tính lại.

**DỮ LIỆU THAM KHẢO (Benchmark 2025):**
- Áo Khoác Nam: Giá 792k, CP Vận hành 291k
- Áo Khoác Nữ: Giá 762k, CP Vận hành 261k
- Áo Sơ Mi Nam: Giá 727k, CP Vận hành 268k
- Quần Dài Nam: Giá 577k, CP Vận hành 214k
- Quần Dài Nữ: Giá 561k, CP Vận hành 208k`;


const CREATIVE_SYSTEM_INSTRUCTION = `Bạn là **Giám đốc Sáng tạo & Dự báo Xu hướng Hàng đầu** (tương đương Senior Editor tại WGSN hoặc Vogue Business).

**MỤC TIÊU:** Cung cấp định hướng sáng tạo tầm nhìn cao nhưng khả thi về mặt thương mại cho V64 tại thị trường Việt Nam.

**CHỈ DẪN QUAN TRỌNG:**
1.  **Ngôn ngữ:** BẮT BUỘC TRẢ LỜI BẰNG **TIẾNG VIỆT**.
2.  **Chi tiết Kỹ thuật Sâu:** Không bao giờ mô tả vải chỉ là "denim". Hãy mô tả: "13oz, 100% Cotton, Red-line Selvedge, kết cấu Slubby, màu Chàm sâu (Deep Indigo cast)."
3.  **Bằng chứng Xu hướng:** Mọi nhận định phải có dẫn chứng (VD: "Thấy tại sàn diễn Diesel FW24", "Viral trên TikTok Việt Nam qua #Streetwear").
4.  **Ngôn ngữ Hình ảnh:** Dùng từ ngữ gợi hình (VD: "Mài rách (Distressed)", "Thô (Raw)", "Cyberpunk", "Utility", "Acid Wash", "Nhuộm phủ (Overdyed)").
5.  **Phù hợp Chiến lược:** Đảm bảo ý tưởng khả thi để sản xuất đại trà tại Việt Nam và khớp với phân khúc giá V64.`;

interface StreamChunk {
    textChunk?: string;
    sources?: { uri: string; title: string }[];
    performanceMetrics?: { timeToFirstChunk: number; totalTime: number };
    suggestions?: string[];
    isFinal?: boolean;
    error?: string;
}

const isQuotaError = (e: any): boolean => {
    if (!e) return false;
    
    // Check for direct code/status properties in the error object
    if (e.code === 429 || e.status === 'RESOURCE_EXHAUSTED') return true;
    if (e.error?.code === 429 || e.error?.status === 'RESOURCE_EXHAUSTED') return true;

    let msg = '';
    if (typeof e === 'string') msg = e;
    else if (e.message) msg = e.message;
    else if (e.toString) msg = e.toString();
    
    // Check string content
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) return true;

    // Try parsing JSON in message (common with some clients/proxies)
    if (msg.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(msg);
            if (parsed.error?.code === 429 || parsed.error?.status === 'RESOURCE_EXHAUSTED') return true;
            if (parsed.code === 429 || parsed.status === 'RESOURCE_EXHAUSTED') return true;
        } catch {}
    }
    
    return false;
}

const handleGeminiError = (e: any): string => {
    // No logging here, let the caller handle logging to allow for warn/error distinction
    const quotaErrorMessage = `Bạn đã vượt quá hạn ngạch sử dụng API miễn phí. Vui lòng kiểm tra gói cước và chi tiết thanh toán của bạn.\n\n- **Để theo dõi mức sử dụng:** [Truy cập Google AI Studio](https://ai.dev/usage)\n- **Để tìm hiểu thêm về giới hạn:** [Xem tài liệu Gemini API](https://ai.google.dev/gemini-api/docs/rate-limits)`;
    
    if (e?.name === 'AbortError') {
        return 'Yêu cầu đã bị hủy.';
    }

    if (isQuotaError(e)) {
        return quotaErrorMessage;
    }
    
    return "Đã có lỗi xảy ra khi gọi Gemini API. Vui lòng thử lại sau.";
};


async function* streamFromGemini(contents: Content[], systemInstruction: string, signal: AbortSignal, isJsonTask: boolean): AsyncGenerator<StreamChunk> {
    const config: any = { systemInstruction };
    
    if (isJsonTask) {
        config.responseMimeType = 'application/json';
    } else {
        config.tools = [{googleSearch: {}}];
    }
    
    const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config,
    });

    let groundingChunks: any[] = [];
    for await (const chunk of stream) {
        if (signal.aborted) throw new Error("Aborted");
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            groundingChunks.push(...chunk.candidates[0].groundingMetadata.groundingChunks);
        }
        if(chunk.text) {
          yield { textChunk: chunk.text };
        }
    }
    
    const sources = groundingChunks
        .map(c => c.web).filter(Boolean)
        .map(s => ({ uri: s.uri, title: s.title }))
        .filter((s, i, arr) => arr.findIndex(t => t.uri === s.uri) === i);

    yield { sources };
}

export async function* getChatResponseStream(
    history: ChatMessage[],
    signal: AbortSignal,
    options: { task?: Task; useCreativePersona?: boolean; } = {}
): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    let firstChunkTime: number | null = null;
    
    let finalContents: Content[] = history.map((msg, index) => {
        const parts: any[] = [{ text: msg.role === 'user' ? msg.rawPrompt || msg.content : msg.content }];
        if (msg.role === 'user' && msg.image && index === history.length - 1) {
            const match = msg.image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/);
            if (match) {
                parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
            }
        }
        return { role: msg.role === 'model' ? 'model' : 'user', parts };
    });
    
    let systemInstruction = options.useCreativePersona ? CREATIVE_SYSTEM_INSTRUCTION : HARDCODED_SYSTEM_INSTRUCTION;

    const lastUserMsg = history[history.length - 1];

    // --- RAG INTEGRATION: INJECT FINANCIAL KNOWLEDGE ---
    if (lastUserMsg && lastUserMsg.role === 'user' && isFinanceQuery(lastUserMsg.content)) {
        const retrievedKnowledge = retrieveFinancialKnowledge(lastUserMsg.content);
        if (retrievedKnowledge.length > 0) {
            const knowledgeText = retrievedKnowledge.map(k => `• ${k.question} (Topic: ${k.topic})`).join('\n');
            
            // Inject into the user's message for better context awareness
            const lastContentPart = finalContents[finalContents.length - 1].parts[0];
            if (typeof lastContentPart.text === 'string') {
                lastContentPart.text = `
[BỐI CẢNH KIẾN THỨC TÀI CHÍNH NỘI BỘ V64]:
${knowledgeText}

CÂU HỎI CỦA NGƯỜI DÙNG:
${lastContentPart.text}
`;
            }
            // Optionally inform UI about the source (can be extended in future)
            // console.log("RAG Activated with:", retrievedKnowledge);
        }
    }
    // ---------------------------------------------------

    // --- RAG INTEGRATION: PRODUCT KNOWLEDGE ---
    if (lastUserMsg && lastUserMsg.role === "user") {
        try {
            const related = await searchProducts(lastUserMsg.content, 5);
            if (related && related.length > 0) {
                const injected = related.map(p =>
                    `• ${p.name} — Cost: ${p.cost} — Price: ${p.price}`
                ).join("\n");

                const lastContent = finalContents[finalContents.length - 1];
                if (lastContent && lastContent.parts && lastContent.parts.length > 0) {
                    const lastPart = lastContent.parts[0];
                    if (typeof lastPart.text === 'string') {
                        // We append to whatever text is currently there (original or already modified by Finance RAG)
                        // Prepend the product data for context
                        lastPart.text = `
[DỮ LIỆU SẢN PHẨM NỘI BỘ V64]
${injected}

${lastPart.text}
`;
                    }
                }
            }
        } catch (error) {
            console.warn("Product RAG failed:", error);
        }
    }
    // ---------------------------------------------------

    const isJsonTask = !!options.task && [
        'market-research', 
        'competitor-analysis', 
        'keyword-analysis', 
        'collection-analysis'
    ].includes(options.task);

    try {
        const stream = streamFromGemini(finalContents, systemInstruction, signal, isJsonTask);
        
        let sources: StreamChunk['sources'] | undefined;
        for await (const chunk of stream) {
            if (signal.aborted) return;
            if (!firstChunkTime) firstChunkTime = Date.now() - startTime;
            if (chunk.sources) sources = chunk.sources;
            if (chunk.textChunk) yield { textChunk: chunk.textChunk };
        }
        
        const totalTime = Date.now() - startTime;
        yield {
            isFinal: true,
            performanceMetrics: { timeToFirstChunk: firstChunkTime || totalTime, totalTime },
            sources: sources,
        };

    } catch (e: any) {
        if (e.name === 'AbortError') return;
        if (isQuotaError(e)) console.warn("Gemini API Quota Exceeded.");
        else console.error("Gemini API failed:", e);
        yield { error: handleGeminiError(e), isFinal: true };
    }
}


export async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
    if (!text) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any introductory phrases or quotes: "${text}"`,
        });
        return response.text.trim();
    } catch (e) {
        console.warn("Gemini translation failed, falling back to MyMemory API. Error:", e);
        try {
            const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
            
            // Multi-proxy fallback strategy
            let res;
            try {
                // 1. Try corsproxy.io (usually fast & stable)
                res = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`);
                if (!res.ok) throw new Error('Proxy 1 failed');
            } catch (p1Err) {
                // 2. Fallback to allorigins.win if corsproxy fails
                console.warn("Proxy 1 failed, trying Proxy 2...");
                res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`);
            }

            if (!res || !res.ok) throw new Error('All translation proxies failed');

            const textResponse = await res.text();
            try {
                const json = JSON.parse(textResponse);
                return json?.responseData?.translatedText || null;
            } catch (parseError) {
                console.error("MyMemory fallback API did not return valid JSON:", parseError, textResponse.substring(0, 500));
                return null;
            }
        } catch (fallbackError) {
            console.error("MyMemory fallback API also failed:", fallbackError);
            return null;
        }
    }
}

export async function createFineTuningExampleFromCorrection(originalPrompt: string, originalResponse: string, correction: string): Promise<string | null> {
    if (!correction || !originalResponse || !originalPrompt) return null;
    try {
        const prompt = `Based on the following user prompt, the AI's original (bad) response, and a user-provided correction, generate an ideal, improved response that incorporates the correction and follows best practices. Only return the final, improved response text.

[USER PROMPT]
${originalPrompt}

[ORIGINAL AI RESPONSE]
${originalResponse}

[USER CORRECTION]
${correction}

[IDEAL, IMPROVED RESPONSE]`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text.trim();
    } catch (e) {
        console.error("Failed to generate fine-tuning example:", e);
        return null;
    }
}


export async function findImageFromSearchQuery(query: string): Promise<string[] | undefined> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Perform a Google search for images matching this query: "${query}". Return a list of the top 3-5 image URLs that are directly viewable (hotlinkable) and high-quality. The URLs must end in .jpg, .jpeg, .png, or .webp. Format the output as a simple JSON array of strings. Example: ["url1.jpg", "url2.png"]`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json'
            }
        });
        
        let jsonString = response.text.trim();
        const jsonBlockMatch = jsonString.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            jsonString = jsonBlockMatch[1];
        }

        const urls = JSON.parse(jsonString);
        return Array.isArray(urls) ? urls : undefined;
    } catch (error) {
        if (isQuotaError(error)) {
            console.warn("Image search skipped due to quota limit.");
            return undefined;
        }
        console.error("Failed to find images from search query:", error);
        return undefined;
    }
}

export interface StressTestResult {
    success: boolean;
    error?: string;
    performance?: { timeToFirstChunk: number; totalTime: number };
}

export async function runStressTestPrompt(prompt: string, signal: AbortSignal): Promise<StressTestResult> {
    const startTime = Date.now();
    let firstChunkTime: number | null = null;
    try {
        const stream = getChatResponseStream([{ role: 'user', content: prompt }], signal);
        for await (const chunk of stream) {
            if (signal.aborted) throw new Error("Aborted");
            if (!firstChunkTime && chunk.textChunk) {
                firstChunkTime = Date.now() - startTime;
            }
            if (chunk.isFinal) {
                return {
                    success: true,
                    performance: {
                        timeToFirstChunk: firstChunkTime || chunk.performanceMetrics?.totalTime || 0,
                        totalTime: chunk.performanceMetrics?.totalTime || 0,
                    }
                };
            }
            if (chunk.error) {
                throw new Error(chunk.error);
            }
        }
        return { success: false, error: "Stream ended unexpectedly" };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function searchShopeeByKeyword(keyword: string): Promise<ShopeeComparisonData | { error: 'quota' | 'generic' } | null> {
    if (!keyword) return null;
    
    try {
        const prompt = `
        You are a Market Researcher for the Vietnam Fashion market.
        
        TASK: Use Google Search to find REAL, CURRENT product listings on Shopee.vn for the keyword: "${keyword}".
        
        CRITICAL INSTRUCTIONS:
        1.  **USE THE SEARCH TOOL**: Do not simulate. You must search for "site:shopee.vn ${keyword}".
        2.  **REAL DATA ONLY**: Extract actual product names and prices from the search results.
        3.  **OUTPUT JSON**: Return the data strictly in the JSON format below.
        
        JSON STRUCTURE:
        {
          "analysis": "A brief 1-2 sentence summary in English about the price range (e.g., 'Prices range from 150k to 400k VND') and competition level based on the search results.",
          "products": [
            {
              "name": "[Actual Product Name from search result]",
              "price": "[Price string found, e.g. '250.000 ₫' - Convert to VND if needed]",
              "link": "[The direct URL found in search results. If a direct product link is not available, use: 'https://shopee.vn/search?keyword=${encodeURIComponent(keyword)}']"
            }
          ]
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json'
            }
        });
        
        let jsonString = response.text.trim();
        const jsonBlockMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            jsonString = jsonBlockMatch[1];
        }

        const data = JSON.parse(jsonString);
        return data as ShopeeComparisonData;

    } catch (error) {
        if (isQuotaError(error)) {
            console.warn("Shopee search skipped due to quota limit.");
            return { error: 'quota' };
        }
        console.error("Failed to search Shopee via Gemini:", error);
        return { error: 'generic' };
    }
}

export async function fetchShopeeProductInfo(url: string): Promise<{ productName: string; price: number } | null> {
    const corsProxy = 'https://corsproxy.io/?';
    
    // API Method 1: v4 pdp/get_pc
    try {
        const urlMatch = url.match(/-i\.(\d+)\.(\d+)/);
        if (urlMatch) {
            const shopId = urlMatch[1];
            const itemId = urlMatch[2];
            const apiUrl = `${corsProxy}${encodeURIComponent(`https://shopee.vn/api/v4/pdp/get_pc?shop_id=${shopId}&item_id=${itemId}`)}`;
            const response = await fetch(apiUrl);
            if (response.ok) {
                const textResponse = await response.text();
                try {
                    const data = JSON.parse(textResponse);
                    if (data && data.data && data.data.name) {
                        const price = data.data.price / 100000; // Price is in a weird unit
                        return { productName: data.data.name, price: price };
                    }
                } catch (jsonError) {
                    console.warn("Shopee API v4 pdp/get_pc did not return JSON. Response was:", textResponse.substring(0, 500));
                }
            }
        }
    } catch (e) {
        console.warn("Shopee API v4 pdp/get_pc failed, trying next method.", e);
    }
    
    // API Method 2: v4 item/get
    try {
        const urlMatch = url.match(/shopee\.vn\/(?:product\/)?(\d+)\/(\d+)/) || url.match(/-i\.(\d+)\.(\d+)/);
         if (urlMatch) {
            const shopId = urlMatch[1];
            const itemId = urlMatch[2];
            const apiUrl = `${corsProxy}${encodeURIComponent(`https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`)}`;
            const response = await fetch(apiUrl);
            if (response.ok) {
                const textResponse = await response.text();
                try {
                    const data = JSON.parse(textResponse);
                    if (data && data.data && data.data.name) {
                        const price = data.data.price / 100000;
                        return { productName: data.data.name, price };
                    }
                } catch (jsonError) {
                    console.warn("Shopee API v4 item/get did not return JSON. Response was:", textResponse.substring(0, 500));
                }
            }
        }
    } catch(e) {
        console.warn("Shopee API v4 item/get failed, trying fallback.", e);
    }
    
    // Fallback: HTML Scraping
    try {
        const proxyUrl = `${corsProxy}${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const html = await response.text();
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (jsonLdMatch && jsonLdMatch[1]) {
            const data = JSON.parse(jsonLdMatch[1]);
            if (data.name && data.offers && (data.offers.price || data.offers.lowPrice)) {
                const price = parseFloat(data.offers.price || data.offers.lowPrice);
                return { productName: data.name, price };
            }
        }
    } catch(e) {
         console.error("Shopee HTML scraping fallback failed.", e);
    }

    throw new Error('Could not parse product information from the Shopee page.');
}

export async function fetchLeviProductInfo(url: string): Promise<{ productName: string; price: number } | null> {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch Levi's page, status: ${response.status}`);
        }
        const html = await response.text();

        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
        if (!jsonLdMatch) {
            throw new Error('Could not find JSON-LD script tag on the Levi\'s page.');
        }

        for (const scriptTagContent of jsonLdMatch) {
            try {
                const jsonContent = scriptTagContent.replace('<script type="application/ld+json">', '').replace('</script>', '');
                const data = JSON.parse(jsonContent);

                if (data['@type'] === 'Product' && data.name && data.offers?.price) {
                    const productName = data.name;
                    const price = parseFloat(data.offers.price);

                    if (productName && !isNaN(price)) {
                        return { productName, price };
                    }
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('Could not parse product information from Levi\'s JSON-LD.');

    } catch (error) {
        console.error("Levi's fetch failed:", error);
        throw error;
    }
}

export async function fetchIconDenimProductInfo(url: string): Promise<{ productName: string; price: number } | null> {
    const corsProxy = 'https://corsproxy.io/?';
    const proxyUrl = `${corsProxy}${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch Icon Denim page, status: ${response.status}`);
        }
        const html = await response.text();

        const jsonMatch = html.match(/var meta = ({[\s\S]*?});/);
        if (!jsonMatch || !jsonMatch[1]) {
            throw new Error('Could not find product metadata script on the Icon Denim page.');
        }

        const rawJson = jsonMatch[1];
        const productJson = JSON.parse(rawJson).product;
        
        if (productJson?.title && productJson?.variants?.[0]?.price) {
            const productName = productJson.title;
            const price = productJson.variants[0].price / 100;
            return { productName, price };
        } else {
            throw new Error('Could not parse product information from metadata.');
        }
    } catch (error) {
        console.error("Icon Denim fetch failed:", error);
        throw error;
    }
}

export async function searchIconDenim(query: string): Promise<{ name: string; price: number; url: string }[] | null> {
    const corsProxy = 'https://corsproxy.io/?';
    const searchUrl = `https://hpo-search-v3.haravan.com/hpo-search/search?q=${encodeURIComponent(query)}&store=icondenim&type=product&limit=10`;
    const proxyUrl = `${corsProxy}${encodeURIComponent(searchUrl)}`;
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch from Haravan search API, status: ${response.status}`);
        }
        const textResponse = await response.text();
        try {
            const data = JSON.parse(textResponse);
            if (data && data.items) {
                return data.items.map((item: any) => ({
                    name: item.title,
                    price: item.price,
                    url: `https://icondenim.com${item.url}`
                }));
            }
            return [];
        } catch (e) {
            console.error("Icon Denim search failed to parse JSON. Response was:", textResponse.substring(0, 500));
            throw new Error('Received an invalid response (not JSON) from the Icon Denim search service.');
        }
    } catch (error) {
        console.error("Icon Denim search failed:", error);
        throw error;
    }
}
