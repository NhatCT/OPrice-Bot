import { GoogleGenAI, Content, Part, Modality, FunctionDeclaration, Type, GenerateContentResponse } from "@google/genai";
import type { ChatMessage } from '../types';

const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI chuyên nghiệp của công ty V64. Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng một cách chính xác và ngắn gọn trong phạm vi chức năng được giao.

Phạm vi chức năng của bạn bao gồm:
1.  **Hỏi đáp về V64**: Trả lời các câu hỏi về công ty, giải pháp, dự án và các thông tin liên quan, chỉ dựa trên kết quả tìm kiếm từ trang web v64.vn.
2.  **Phân tích kinh doanh**: Đóng vai trò là một chuyên gia kinh doanh khi được yêu cầu. Phân tích lợi nhuận một cách linh hoạt (tính giá bán, doanh số mục tiêu, lợi nhuận tiềm năng). Khi được yêu cầu "tham khảo giá thị trường", hãy sử dụng công cụ tìm kiếm (Google Search) để so sánh giá và đưa ra nhận định.

**QUY TẮC QUAN TRỌNG:**
- Nếu người dùng hỏi những câu hỏi nằm ngoài hai phạm vi chức năng trên, bạn PHẢI lịch sự từ chối trả lời. Hãy giải thích rằng bạn chỉ có thể hỗ trợ các vấn đề liên quan đến V64 và phân tích kinh doanh. Ví dụ: "Xin lỗi, tôi chỉ có thể hỗ trợ các câu hỏi liên quan đến công ty V64 và các bài toán phân tích kinh doanh. Tôi có thể giúp gì khác cho bạn trong phạm vi này không?"
- Luôn trả lời bằng tiếng Việt.
- Luôn cung cấp nguồn tham khảo nếu có.`;

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("VITE_API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey });

const model = 'gemini-2.5-flash';


function mapHistoryToContent(history: ChatMessage[]): Content[] {
    return history.map(msg => {
        const parts: Part[] = [];
        if (msg.image) {
            const base64Data = msg.image.data.split(',')[1];
            if(base64Data){
                parts.push({
                    inlineData: { mimeType: msg.image.mimeType, data: base64Data }
                });
            }
        }
        parts.push({ text: msg.content });
        return { role: msg.role, parts: parts };
    });
}

// New utility to generate a title for a conversation
export async function summarizeTitle(firstMessage: string): Promise<string> {
    try {
        const prompt = `Hãy tóm tắt yêu cầu sau thành một tiêu đề ngắn gọn (tối đa 6 từ) bằng tiếng Việt: "${firstMessage}"`;
        const result = await ai.models.generateContent({ model: model, contents: prompt });
        let title = result.text.trim().replace(/["']/g, ""); // Remove quotes
        // Capitalize first letter
        title = title.charAt(0).toUpperCase() + title.slice(1);
        return title;
    } catch (error) {
        console.error("Title summarization failed:", error);
        return firstMessage.substring(0, 30) + '...'; // Fallback to truncation
    }
}

export interface StreamedChatResponse {
    textChunk?: string;
    sources?: { uri: string; title: string }[];
    image?: { data: string; mimeType: string };
    isFinal: boolean;
    error?: string;
    performanceMetrics?: {
        timeToFirstChunk: number;
        totalTime: number;
    };
}

export async function* getChatResponseStream(
    history: ChatMessage[],
    signal: AbortSignal
): AsyncGenerator<StreamedChatResponse> {
    const startTime = performance.now();
    let firstChunkTime = 0;

    try {
        if (signal.aborted) return;
        
        const lastMessage = history[history.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
            yield { isFinal: true, error: "Lỗi: Không tìm thấy tin nhắn hợp lệ của người dùng." };
            return;
        }

        const isPricingTask = lastMessage.content.startsWith('Hãy đóng vai trò là một chuyên gia kinh doanh') || lastMessage.content.startsWith('Tôi có một nhóm sản phẩm');
        const useMarketData = lastMessage.content.includes('tham khảo giá thị trường');
        
        const historyForApi = JSON.parse(JSON.stringify(history));
        const lastMessageForApi = historyForApi[historyForApi.length - 1];
        
        // Append site search for non-pricing tasks to ground responses
        if (!isPricingTask) {
            lastMessageForApi.content = `${lastMessageForApi.content} site:v64.vn`;
        }
        
        const contents = mapHistoryToContent(historyForApi);

        // For pricing tasks with market data, or any non-pricing task, use Google Search.
        const shouldUseSearch = useMarketData || !isPricingTask;

        const stream = await ai.models.generateContentStream({
            model: model,
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: shouldUseSearch ? [{googleSearch: {}}] : undefined,
            },
        });
        
        const signalPromise = new Promise((_, reject) => {
            signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });

        const streamIterator = stream[Symbol.asyncIterator]();

        while (true) {
            const { value: chunk, done } = await Promise.race([
                streamIterator.next(),
                signalPromise,
            ]).catch(e => { throw e; });

            if (done) break;
            
            if (chunk.text && firstChunkTime === 0) {
                firstChunkTime = performance.now() - startTime;
            }

            const text = chunk.text;
            if (text) {
                yield { textChunk: text, isFinal: false };
            }
        }
        
        // Once the stream is finished, get the complete response to extract grounding sources
        const response = await stream.response;
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        if (response) {
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            const sources = groundingChunks
                .map(chunk => chunk.web)
                .filter((web): web is { uri: string; title:string } => !!web?.uri && !!web?.title)
                // Deduplicate sources by URI
                .filter((value, index, self) => index === self.findIndex((t) => (t.uri === value.uri)));
            
            yield { 
                sources: sources.length > 0 ? sources : undefined, 
                isFinal: true,
                performanceMetrics: {
                    timeToFirstChunk: Math.round(firstChunkTime),
                    totalTime: Math.round(totalTime)
                }
            };
        } else {
             yield { 
                 isFinal: true,
                 performanceMetrics: {
                    timeToFirstChunk: Math.round(firstChunkTime),
                    totalTime: Math.round(totalTime)
                 }
            };
        }

    } catch (error: any) {
        if (error.name === 'AbortError') {
             console.log('Stream generation aborted by user.');
             // Yield a final empty chunk to signal completion
             yield { isFinal: true };
             return;
        }
        console.error("Gemini API error:", error);
        yield {
            isFinal: true,
            error: "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau."
        };
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
    const startTime = performance.now();
    let firstChunkTime = 0;

    try {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

        const useMarketData = prompt.includes('tham khảo giá thị trường');
        const isPricingTask = prompt.startsWith('Hãy đóng vai trò là một chuyên gia kinh doanh');

        const content = {
            role: 'user',
            parts: [{ text: isPricingTask ? prompt : `${prompt} site:v64.vn` }],
        };

        const shouldUseSearch = useMarketData || !isPricingTask;

        const stream = await ai.models.generateContentStream({
            model,
            contents: [content],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: shouldUseSearch ? [{ googleSearch: {} }] : undefined,
            },
        });

        const signalPromise = new Promise((_, reject) => {
            signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
        
        const streamIterator = stream[Symbol.asyncIterator]();

        while (true) {
            const { value: chunk, done } = await Promise.race([
                streamIterator.next(),
                signalPromise,
            ]);
            if (done) break;
            if (chunk.text && firstChunkTime === 0) {
                firstChunkTime = performance.now() - startTime;
            }
        }
        
        await stream.response; // Wait for the full response to complete
        const endTime = performance.now();

        return {
            success: true,
            performance: {
                timeToFirstChunk: Math.round(firstChunkTime),
                totalTime: Math.round(endTime - startTime),
            },
        };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Stress test prompt aborted.');
            return { success: false, error: 'Aborted' };
        }
        console.error("Stress test API error:", error);
        return { success: false, error: error.message || "Unknown API error" };
    }
}