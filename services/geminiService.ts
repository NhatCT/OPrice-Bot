import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Type, Content, Modality } from '@google/genai';
import type { ChatMessage, Task } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("API_KEY is missing. The application will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });


const HARDCODED_SYSTEM_INSTRUCTION = `You are a specialized business assistant for 'V64', a Vietnamese company. You have access to the following V64 2025 costsheet data. Use this data for any relevant business analysis unless the user provides different data.
---
Bảng giá và chi phí sản phẩm V64 (đơn vị VND):
- Áo Khoác Nam: Giá bán 792,000, Chi phí vận hành 291,699
- Áo Khoác Nữ: Giá bán 762,750, Chi phí vận hành 261,111
- Áo Sơ Mi Nam: Giá bán 727,313, Chi phí vận hành 268,293
- Áo Sơ Mi Nữ: Giá bán 692,438, Chi phí vận hành 295,659
- Áo Kiểu: Giá bán 615,375, Chi phí vận hành 227,764
- Đầm: Giá bán 723,375, Chi phí vận hành 266,861
- Quần Dài Nam: Giá bán 577,969, Chi phí vận hành 214,225
- Quần Dài Nữ: Giá bán 561,938, Chi phí vận hành 208,422
- Shorts Nam: Giá bán 447,188, Chi phí vận hành 166,884
- Shorts Nữ: Giá bán 415,125, Chi phí vận hành 155,568
- Váy: Giá bán 452,813, Chi phí vận hành 168,922
---

Your capabilities include:
1.  **Answering questions about V64:** Respond to inquiries about the company, its solutions, projects, and related information using the search results provided to you.
2.  **Performing Business Analysis:** Execute specific business analysis tasks (like profit, promotion, pricing, and market research analysis) based on structured data provided by the user OR the costsheet data above.
3.  **Analyzing Data from Images:** Read, interpret, and perform calculations on data from user-uploaded images (e.g., spreadsheets, reports) to answer their questions.

You MUST adhere to these rules:
- If the user's query is outside these defined areas (e.g., general knowledge, weather, chit-chat, personal opinions, cooking recipes, etc.), you MUST politely decline.
- When declining, state that you are a specialized assistant for V64 and can only help with V64-related topics or business analysis based on provided data.
- Do NOT attempt to answer out-of-scope questions. For example, if asked 'what is 1+1', do not answer '2'. Decline the request.
- All your analysis and responses should be professional and business-oriented.
- Your response must be in English, as it will be translated by the application.`;


const getSystemInstruction = async (): Promise<string> => {
    return HARDCODED_SYSTEM_INSTRUCTION;
};


const CREATIVE_SYSTEM_INSTRUCTION = `You are a world-class Fashion Trend Analyst and Creative Director for 'V64', a Vietnamese fashion brand. Your role is to conduct strategic analysis of global fashion trends to develop groundbreaking collection ideas. Your analysis must be insightful, strategic, and tailored to the brand's context.

**CRITICAL RULE:** For any market research or trend analysis task, you **MUST use Google Search** to find the latest, most relevant information from reputable sources (e.g., WGSN, Vogue Runway, Business of Fashion, market reports).

Your response must be in English, as it will be translated by the application.`;


interface StreamChunk {
    textChunk?: string;
    sources?: { uri: string; title:string }[];
    performanceMetrics?: { timeToFirstChunk: number; totalTime: number };
    isFinal?: boolean;
    error?: string;
}

// Chuyển đổi lịch sử chat của frontend sang định dạng Content của Gemini API
const buildGeminiHistory = (history: ChatMessage[]): Content[] => {
    return history.map(msg => {
        // Skip user messages with images as they are handled separately
        if (msg.role === 'user' && msg.image) {
            return null;
        }
        const role = msg.role === 'user' ? 'user' : 'model';
        const contentToUse = msg.isTranslated && msg.originalContent ? msg.originalContent : msg.content;
        return {
            role: role,
            parts: [{ text: contentToUse }]
        };
    }).filter(Boolean) as Content[];
};

// Kiểm tra xem prompt có cần tra cứu Google không
const needsGoogleSearch = (prompt: string): boolean => {
    const lowerPrompt = prompt.toLowerCase();
    const keywords = [
        'sử dụng google search', 
        'use google search',
        'tham khảo giá thị trường',
        'market price',
        'đối thủ cạnh tranh',
        'competitors'
    ];
    return keywords.some(kw => lowerPrompt.includes(kw));
};

// Kiểm tra xem prompt có phải là câu hỏi về V64 không
const isV64Question = (prompt: string): boolean => {
    const keywords = ['v64', 'công ty', 'giải pháp', 'dự án', 'company', 'solutions', 'projects'];
    const lowerPrompt = prompt.toLowerCase();
    const isBusiness = ['phân tích lợi nhuận', 'phân tích khuyến mãi', 'phân tích đồng giá', 'profit analysis', 'promo analysis'].some(kw => lowerPrompt.includes(kw));
    return !isBusiness && keywords.some(kw => lowerPrompt.includes(kw));
}

// Kiểm tra xem prompt có phải là yêu cầu phân tích kinh doanh không
const isBusinessAnalysis = (prompt: string): boolean => {
    const lowerPrompt = prompt.toLowerCase();
    const keywords = ['phân tích lợi nhuận', 'phân tích khuyến mãi', 'phân tích đồng giá', 'profit analysis', 'promo analysis', 'market research', 'nghiên cứu xu hướng', 'brand positioning', 'định vị thương hiệu', 'phân tích cạnh tranh'];
    return keywords.some(kw => lowerPrompt.includes(kw));
}

// Kiểm tra xem prompt có yêu cầu phản hồi JSON để phân tích không
const isJsonAnalysisTask = (prompt: string): boolean => {
    return prompt.includes('REQUIRED OUTPUT FORMAT: JSON') || prompt.includes('YÊU CẦU ĐỊNH DẠNG ĐẦU RA: JSON');
};

const marketResearchSchema = {
  type: Type.OBJECT,
  properties: {
    trend_sections: {
      type: Type.ARRAY,
      description: 'An array of major trend sections.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'The title of the trend section, e.g., "1. Trend Core – Y2K Revival".' },
          description: { type: Type.STRING, description: 'A short, bulleted list of key characteristics of the trend in Vietnamese. Use Markdown for bullet points. E.g., "- Quần túi hộp, áo nhiều ngăn\\n- Thắt lưng trang trí đặc sắc"' },
          key_items: {
            type: Type.ARRAY,
            description: 'An array of 5 key fashion items that exemplify this trend.',
            items: {
              type: Type.OBJECT,
              properties: {
                brand_name: { type: Type.STRING, description: 'The name of a real-world brand that showcases this trend, e.g., "DOLCE & GABBANA".' },
                image_search_query: { type: Type.STRING, description: 'A concise, effective English search query for Google Images to find a real runway, studio, or street style photo of this item from the specified brand and trend. Example: "runway photo of baggy stone wash jeans Nili Lotan Fall 2024".' }
              },
              required: ['brand_name', 'image_search_query']
            }
          }
        },
        required: ['title', 'description', 'key_items']
      }
    },
    wash_effect_summary: {
      type: Type.OBJECT,
      description: 'A summary section for washing effects.',
      properties: {
        title: { type: Type.STRING, description: 'The title of this section, e.g., "4. Washing Effect – Hiệu ứng wash".' },
        table: {
          type: Type.ARRAY,
          description: 'A table summarizing different wash types.',
          items: {
            type: Type.OBJECT,
            properties: {
              wash_type: { type: Type.STRING, description: 'The name of the wash effect, e.g., "Smoky grey wash".' },
              application_effect: { type: Type.STRING, description: 'The application and effect of the wash in Vietnamese, e.g., "Màu tro xám vintage".' }
            },
            required: ['wash_type', 'application_effect']
          }
        }
      },
      required: ['title', 'table']
    }
  },
  required: ['trend_sections', 'wash_effect_summary']
};


export async function* getChatResponseStream(
    history: ChatMessage[],
    signal: AbortSignal,
    options?: { task?: Task; useCreativePersona?: boolean }
): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    let firstChunkTime: number | null = null;
    
    const lastMessage = history[history.length - 1];
    const prompt = lastMessage.content;
    const task = options?.task;
    
    const isAnalysisFromPrompt = !task && isBusinessAnalysis(prompt);
    const useProModel = task === 'profit-analysis' || task === 'promo-price' || task === 'group-price' || task === 'market-research' || task === 'brand-positioning' || isAnalysisFromPrompt;
    const modelName = useProModel ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    let systemInstruction: string;
    if (options?.useCreativePersona) {
        systemInstruction = CREATIVE_SYSTEM_INSTRUCTION;
    } else {
        systemInstruction = await getSystemInstruction();
    }

    const request: GenerateContentParameters = {
        model: modelName,
        contents: [],
        config: {
            systemInstruction: systemInstruction
        }
    };

    // Build content history, handling multimodal input for the last message
    const previousHistory = buildGeminiHistory(history.slice(0, -1));
    let lastContent: Content;

    if (lastMessage.role === 'user' && lastMessage.image) {
        const imageBase64 = lastMessage.image;
        const mimeTypeMatch = imageBase64.match(/data:(image\/.*?);/);
        if (!mimeTypeMatch) {
            yield { isFinal: true, error: "Định dạng hình ảnh không hợp lệ." };
            return;
        }
        const mimeType = mimeTypeMatch[1];
        const data = imageBase64.split(',')[1];
        
        lastContent = {
            role: 'user',
            parts: [
                { text: prompt },
                { inlineData: { mimeType, data } }
            ]
        };
    } else {
         lastContent = {
            role: lastMessage.role === 'user' ? 'user' : 'model',
            parts: [{ text: prompt }]
        };
    }

    request.contents = [...previousHistory, lastContent];

    const isAnalysis = isJsonAnalysisTask(prompt);
    const useGrounding = task === 'market-research' || task === 'brand-positioning' || needsGoogleSearch(prompt) || isV64Question(prompt);

    if (isAnalysis) {
        request.config!.responseMimeType = "application/json";
        if (task === 'market-research') {
            request.config!.responseSchema = marketResearchSchema;
            request.config!.tools = [{ googleSearch: {} }];
        } else {
            request.config!.responseSchema = {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING, description: "A concise summary of the key metrics from the analysis. Important numbers and conclusions MUST be formatted in bold using Markdown (e.g., **1,234,567 VND** or **+25%**). Newlines must be escaped as \\n." },
                    analysis: { type: Type.STRING, description: "Detailed analysis text. Newlines must be escaped as \\n." },
                    charts: {
                        type: Type.ARRAY,
                        description: "An array of chart objects.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING, description: "Type of the chart, e.g., 'bar'." },
                                title: { type: Type.STRING, description: "Title of the chart." },
                                unit: { type: Type.STRING, description: "Unit for the chart values (e.g., 'VND', '%'). Leave empty for dimensionless values." },
                                data: {
                                    type: Type.ARRAY,
                                    description: "Data points for the chart.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING, description: "Label for the data point." },
                                            value: { type: Type.NUMBER, description: "Value for the data point." }
                                        },
                                        required: ['name', 'value']
                                    }
                                }
                            },
                            required: ['type', 'title', 'data']
                        }
                    }
                },
                required: ['summary', 'analysis', 'charts']
            };
            if (useGrounding) {
                 request.config!.tools = [{ googleSearch: {} }];
            }
        }
    } else if (useGrounding) {
        request.config!.tools = [{ googleSearch: {} }];
    }
    
    try {
        const resultStream = await ai.models.generateContentStream(request);
        
        let lastChunk: GenerateContentResponse | null = null;

        signal.addEventListener('abort', () => {
            console.log("Stream abort requested.");
        });

        for await (const chunk of resultStream) {
            if (signal.aborted) {
              console.log("Aborting stream processing.");
              break;
            }
            if (!firstChunkTime && chunk.text) {
                firstChunkTime = Date.now() - startTime;
            }
            yield { textChunk: chunk.text };
            lastChunk = chunk;
        }
        
        const finalResponse = lastChunk;
        const totalTime = Date.now() - startTime;

        if (!finalResponse) {
            console.warn("Gemini stream ended without a final response object.");
            yield {
                isFinal: true,
                sources: [],
                performanceMetrics: {
                    timeToFirstChunk: firstChunkTime ?? totalTime,
                    totalTime,
                },
            };
            return;
        }

        const groundingMetadata = finalResponse.candidates?.[0]?.groundingMetadata;
        const sources = groundingMetadata?.groundingChunks
            ?.map((c: any) => c.web)
            .filter(Boolean)
            .map((web: any) => ({ uri: web.uri, title: web.title })) || [];

        yield {
            isFinal: true,
            sources,
            performanceMetrics: {
                timeToFirstChunk: firstChunkTime ?? totalTime,
                totalTime,
            },
        };

    } catch (e: any) {
        if (e.name !== 'AbortError') {
            console.error("Gemini API stream failed:", e);
            yield { isFinal: true, error: "Đã có lỗi xảy ra với dịch vụ AI: " + e.message };
        } else {
            console.log("Stream aborted by user.");
            yield { isFinal: true };
        }
    }
}

export const translateText = async (text: string, sourceLang: 'vi' | 'en', targetLang: 'vi' | 'en'): Promise<string | null> => {
    if (!text || !text.trim()) return text;
    
    const sourceLangName = sourceLang === 'vi' ? 'Vietnamese' : 'English';
    const targetLangName = targetLang === 'vi' ? 'Vietnamese' : 'English';

    const prompt = `Translate the following ${sourceLangName} text to ${targetLangName}. IMPORTANT: Return ONLY the translated text, without any additional comments, formatting, or explanations.
    
    TEXT TO TRANSLATE:
    ---
    ${text}
    ---
    `;
    
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
            });
            return response.text.trim();
        } catch (error) {
            attempts++;
            console.error(`Attempt ${attempts}: Failed to translate text from ${sourceLang} to ${targetLang}:`, error);
            if (attempts >= maxRetries) {
                return null; // Return null after the last attempt
            }
            // Wait for a short period before retrying
            await new Promise(res => setTimeout(res, 500 * attempts));
        }
    }
    return null; // Should be unreachable, but for type safety
};

export const findImageFromSearchQuery = async (query: string): Promise<string | null> => {
    if (!query) return null;
    try {
        // Use Unsplash Source which is designed for this kind of hotlinking and can use the query.
        // We directly return the URL and let the <img> tag handle the loading and any redirects.
        // This is more robust against CORS/CSP issues that can block client-side fetch() calls.
        // The ImageWithStatus component will gracefully handle if the image fails to load.

        // Sanitize and encode the query for the URL.
        const sanitizedQuery = query.split(',').slice(0, 3).join(','); // Use first few keywords for better results
        const encodedQuery = encodeURIComponent(sanitizedQuery);
        
        return `https://source.unsplash.com/400x600/?${encodedQuery}`;
    } catch (error) {
        // This block is now less likely to be hit, but good to keep.
        console.error("Failed to construct image search URL:", error);
        return null;
    }
};

export interface StressTestResult {
    success: boolean;
    error?: string;
    performance?: {
        timeToFirstChunk: number;
        totalTime: number;
    };
}

export async function runStressTestPrompt(prompt: string, signal: AbortSignal): Promise<StressTestResult> {
    const startTime = Date.now();
    let firstChunkTime: number | null = null;
    
    try {
        const stream = getChatResponseStream([{ role: 'user', content: prompt }], signal);
        
        for await (const chunk of stream) {
             if (signal.aborted) break;
             if (!firstChunkTime && chunk.textChunk) {
                firstChunkTime = Date.now() - startTime;
            }
            if (chunk.isFinal) {
                 const totalTime = Date.now() - startTime;
                 if (chunk.error) {
                     return { success: false, error: chunk.error };
                 }
                 return {
                    success: true,
                    performance: {
                        timeToFirstChunk: chunk.performanceMetrics?.timeToFirstChunk ?? firstChunkTime ?? totalTime,
                        totalTime: chunk.performanceMetrics?.totalTime ?? totalTime,
                    },
                 };
            }
        }
       if (signal.aborted) return { success: false, error: "Aborted" };
       return { success: false, error: 'Stream ended unexpectedly' };
    } catch (e: any) {
        if (e.name !== 'AbortError') {
            console.error("Stress test API call failed:", e);
            return { success: false, error: e.message || "Unknown error" };
        }
        return { success: false, error: "Aborted" };
    }
}

/**
 * Automatically creates a high-quality fine-tuning example based on user correction.
 * This function is called when a user gives negative feedback and then provides a corrective follow-up.
 * @param originalPrompt The user's initial prompt.
 * @param badResponse The AI's unsatisfactory response.
 * @param userCorrection The user's follow-up message, treated as the 'correct' way to respond.
 * @returns A string representing the ideal response, generated by the AI based on the correction.
 */
export const createFineTuningExampleFromCorrection = async (
    originalPrompt: string,
    badResponse: string,
    userCorrection: string
): Promise<string | null> => {
    const metaPrompt = `
        Một người dùng đã đưa ra phản hồi tiêu cực cho một câu trả lời của AI và sau đó cung cấp một thông điệp sửa chữa.
        Nhiệm vụ của bạn là tạo ra một câu trả lời "lý tưởng" mới. Câu trả lời lý tưởng này nên:
        1. Đáp ứng **Yêu cầu Gốc** của người dùng.
        2. Học hỏi từ **Thông điệp Sửa chữa** để hiểu ý định thực sự của người dùng hoặc phong cách họ mong muốn.
        3. Tránh lặp lại những sai lầm trong **Câu trả lời Tệ**.

        Đây là dữ liệu:
        -----------------
        YÊU CẦU GỐC:
        "${originalPrompt}"
        -----------------
        CÂU TRẢ LỜI TỆ:
        "${badResponse}"
        -----------------
        THÔNG ĐIỆP SỬA CHỮA CỦA NGƯỜI DÙNG:
        "${userCorrection}"
        -----------------

        Bây giờ, hãy tạo ra CÂU TRẢ LỜI LÝ TƯỞNG mà AI nên đưa ra ngay từ đầu.
        Chỉ trả về nội dung của câu trả lời lý tưởng, không thêm bất kỳ lời giải thích nào.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [{ text: metaPrompt }] }
        });
        return response.text;
    } catch (error) {
        console.error("Failed to create fine-tuning example:", error);
        return null;
    }
};