import { GoogleGenAI, GenerateContentRequest, Type, Content } from '@google/genai';
import type { ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("API_KEY is missing. The application will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const modelName = 'gemini-2.5-flash';

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
        const role = msg.role === 'user' ? 'user' : 'model';
        return {
            role: role,
            parts: [{ text: msg.content }]
        };
    });
};

// Kiểm tra xem prompt có cần tra cứu thị trường (grounding) không
const needsMarketGrounding = (prompt: string): boolean => {
    const lowerPrompt = prompt.toLowerCase();
    return lowerPrompt.includes('tham khảo giá thị trường');
};

// Kiểm tra xem prompt có phải là câu hỏi về V64 không
const isV64Question = (prompt: string): boolean => {
    const keywords = ['v64', 'công ty', 'giải pháp', 'dự án'];
    const lowerPrompt = prompt.toLowerCase();
    const isBusiness = ['phân tích lợi nhuận', 'phân tích khuyến mãi', 'phân tích đồng giá'].some(kw => lowerPrompt.includes(kw));
    return !isBusiness && keywords.some(kw => lowerPrompt.includes(kw));
}

// Kiểm tra xem prompt có yêu cầu phản hồi JSON để phân tích không
const isJsonAnalysisTask = (prompt: string): boolean => {
    return prompt.includes('YÊU CẦU ĐỊNH DẠNG ĐẦU RA');
};

export async function* getChatResponseStream(
    history: ChatMessage[],
    signal: AbortSignal
): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    let firstChunkTime: number | null = null;
    
    const contents: Content[] = buildGeminiHistory(history);

    const lastMessage = history[history.length - 1];
    const prompt = lastMessage.content;
    
    const request: GenerateContentRequest = {
        model: modelName,
        contents: contents,
        config: {}
    };

    if (isJsonAnalysisTask(prompt)) {
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
    } else if (needsMarketGrounding(prompt) || isV64Question(prompt)) {
        // This is now an else-if to prevent using tools with JSON response type.
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