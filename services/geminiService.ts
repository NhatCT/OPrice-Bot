import { GoogleGenAI, GenerateContentParameters, Type, Content, Modality } from '@google/genai';
// FIX: Add Task to import to be used in getChatResponseStream signature
import type { ChatMessage, Task } from '../types';
import { getCostSheetData, CostSheetItem } from './dataService';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("API_KEY is missing. The application will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const modelName = 'gemini-2.5-flash';

let systemInstructionCache: string | null = null;

const buildSystemInstruction = (costSheetItems: CostSheetItem[]): string => {
    const productDataString = costSheetItems.map(item => {
        const fPrice = Number(item.price).toLocaleString('vi-VN');
        const fCostGoods = Number(item.costOfGoods).toLocaleString('vi-VN');
        const fOpCost = Number(item.operatingCost).toLocaleString('vi-VN');
        return `- ${item.name}: Giá bán ${fPrice}, Giá vốn ${fCostGoods}, Chi phí vận hành ${fOpCost}`;
    }).join('\n');

    return `You are a specialized business assistant for 'V64', a Vietnamese company. You have access to the following V64 2025 costsheet data. Use this data for any relevant business analysis unless the user provides different data.
---
Bảng giá và chi phí sản phẩm V64 (đơn vị VND):
${productDataString}
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
};

const getSystemInstruction = async (): Promise<string> => {
    if (systemInstructionCache) {
        return systemInstructionCache;
    }
    try {
        const costSheetItems = await getCostSheetData();
        if (costSheetItems.length > 0) {
            systemInstructionCache = buildSystemInstruction(costSheetItems);
            return systemInstructionCache;
        } else {
            throw new Error("No items from cost sheet");
        }
    } catch (error) {
        console.warn("Could not fetch dynamic system instruction, using fallback.", error);
        // Fallback to old hardcoded data
        return `You are a specialized business assistant for 'V64', a Vietnamese company. You have access to the following V64 2025 costsheet data. Use this data for any relevant business analysis unless the user provides different data.
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
    }
};


const CREATIVE_SYSTEM_INSTRUCTION = `You are a world-class Fashion Expert and Creative Director for 'V64', a Vietnamese fashion brand. Your role is to conduct strategic analysis of global fashion trends to develop groundbreaking collection ideas.

You MUST adhere to these rules:
- For any market research or trend analysis task, you **MUST use Google Search** to find the latest, most relevant information from reputable sources (e.g., WGSN, Vogue, Business of Fashion, market reports).
- Your analysis must be insightful, strategic, and tailored to the brand's context.
- Your response must be in English, as it will be translated by the application.`;


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

// Kiểm tra xem prompt có cần tra cứu thị trường (grounding) không
const needsMarketGrounding = (prompt: string): boolean => {
    const lowerPrompt = prompt.toLowerCase();
    return lowerPrompt.includes('tham khảo giá thị trường') || lowerPrompt.includes('market price') || lowerPrompt.includes('đối thủ cạnh tranh');
};

// Kiểm tra xem prompt có phải là câu hỏi về V64 không
const isV64Question = (prompt: string): boolean => {
    const keywords = ['v64', 'công ty', 'giải pháp', 'dự án', 'company', 'solutions', 'projects'];
    const lowerPrompt = prompt.toLowerCase();
    const isBusiness = ['phân tích lợi nhuận', 'phân tích khuyến mãi', 'phân tích đồng giá', 'profit analysis', 'promo analysis'].some(kw => lowerPrompt.includes(kw));
    return !isBusiness && keywords.some(kw => lowerPrompt.includes(kw));
}

// Kiểm tra xem prompt có yêu cầu phản hồi JSON để phân tích không
const isJsonAnalysisTask = (prompt: string): boolean => {
    return prompt.includes('YÊU CẦU ĐỊNH DẠNG ĐẦU RA') || prompt.includes('REQUIRED OUTPUT FORMAT');
};

// FIX: Update function signature to accept a `useCreativePersona` flag.
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

    let systemInstruction: string;
    if (options?.useCreativePersona) {
        systemInstruction = CREATIVE_SYSTEM_INSTRUCTION;
    } else {
        systemInstruction = await getSystemInstruction();
    }

    // FIX: Changed GenerateContentRequest to GenerateContentParameters
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
    // FIX: Use the 'task' variable passed in options to reliably determine if grounding is needed,
    // instead of relying on fragile keyword matching in the prompt. This ensures 'market-research'
    // and other analysis tasks correctly trigger the Google Search tool.
    const useGrounding = task === 'market-research' || task === 'brand-positioning' || needsMarketGrounding(prompt) || isV64Question(prompt);

    if (isAnalysis && useGrounding) {
        // For analysis tasks that ALSO need market data, use the grounding tool.
        // The detailed prompt already instructs the model to return a JSON code block.
        request.config!.tools = [{ googleSearch: {} }];
    } else if (isAnalysis) {
        // For analysis tasks WITHOUT market data, use the strict JSON mode.
        request.config!.responseMimeType = "application/json";
        request.config!.responseSchema = {
            type: Type.OBJECT,
            properties: {
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
            required: ['analysis', 'charts']
        };
    } else if (useGrounding) {
        // For simple Q&A with grounding (e.g., V64 questions).
        request.config!.tools = [{ googleSearch: {} }];
    }
    
    try {
        const streamResult = await ai.models.generateContentStream(request);
        
        signal.addEventListener('abort', () => {
            console.log("Stream abort requested.");
        });

        for await (const chunk of streamResult) {
            if (signal.aborted) {
              console.log("Aborting stream processing.");
              break;
            }
            if (!firstChunkTime && chunk.text) {
                firstChunkTime = Date.now() - startTime;
            }
            yield { textChunk: chunk.text };
        }
        
        const finalResponse = await streamResult.response;
        const totalTime = Date.now() - startTime;

        // FIX: Add a defensive check for finalResponse. The stream can end
        // without a valid final response object in some cases (e.g., if the
        // prompt is completely empty or triggers safety filters immediately).
        // This prevents the "Cannot read properties of undefined (reading 'candidates')" error.
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
    if (!text.trim()) return text;
    
    const sourceLangName = sourceLang === 'vi' ? 'Vietnamese' : 'English';
    const targetLangName = targetLang === 'vi' ? 'Vietnamese' : 'English';

    const prompt = `Translate the following ${sourceLangName} text to ${targetLangName}. IMPORTANT: Return ONLY the translated text, without any additional comments, formatting, or explanations.
    
    TEXT TO TRANSLATE:
    ---
    ${text}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Failed to translate text from ${sourceLang} to ${targetLang}:`, error);
        return null;
    }
};


export const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
    if (!prompt) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        if (!response.candidates || response.candidates.length === 0) {
            const feedback = response.promptFeedback;
            console.error("Image generation failed: No candidates returned. This might be due to safety filters.", {
                prompt,
                blockReason: feedback?.blockReason,
                safetyRatings: feedback?.safetyRatings,
            });
            return null;
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data; // This is the base64 string
            }
        }
        console.warn('Image generation call succeeded but no image data was returned in parts.');
        return null;

    } catch (error) {
        // FIX: Improve error logging to prevent "[object Object]".
        // Create a clear, single-string error message for logging.
        let detailedError = 'An unknown error occurred.';
        if (error instanceof Error) {
            detailedError = error.message;
        } else if (typeof error === 'object' && error !== null) {
            detailedError = (error as any).message || JSON.stringify(error);
        } else {
            detailedError = String(error);
        }
        console.error(`Failed to generate image from prompt: ${detailedError}. Prompt was: "${prompt}"`);
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
            model: modelName,
            contents: metaPrompt
        });
        // FIX: Changed response.text() to response.text
        return response.text;
    } catch (error) {
        console.error("Failed to create fine-tuning example:", error);
        return null;
    }
};
