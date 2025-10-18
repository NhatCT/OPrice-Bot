import { GoogleGenAI, Content, Part, Modality, FunctionDeclaration, Type, GenerateContentResponse, FunctionCall } from "@google/genai";
import type { ChatMessage } from '../types';

const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI chuyên nghiệp của công ty V64, chuyên hỗ trợ các vấn đề liên quan đến V64, phân tích kinh doanh và thực thi các tác vụ được yêu cầu.

**QUY TẮC CỰC KỲ QUAN TRỌNG (BẮT BUỘC TUÂN THỦ):**
1.  **PHẠM VI NHIỆM VỤ:** Nhiệm vụ của bạn bao gồm:
    *   **Thông tin về công ty V64:** giải pháp, dự án, tin tức, v.v., dựa trên tìm kiếm từ website v64.vn.
    *   **Phân tích kinh doanh:** thực hiện các bài toán tính giá, lợi nhuận, khuyến mãi.
    *   **Thực thi tác vụ:** Khi người dùng yêu cầu một hành động cụ thể (như "tạo", "cập nhật", "gửi"), hãy sử dụng các công cụ (functions) được cung cấp.
    Nếu người dùng hỏi bất kỳ câu hỏi nào khác ngoài phạm vi trên, bạn **TUYỆT ĐỐI KHÔNG ĐƯỢC TRẢ LỜI**. Thay vào đó, hãy lịch sự từ chối.

2.  **Nguồn thông tin V64:** Mọi câu trả lời về V64 phải dựa trên kết quả tìm kiếm từ trang web \`v64.vn\`. Luôn luôn sử dụng công cụ tìm kiếm được cung cấp.

3.  **Luôn trả lời bằng tiếng Việt.**

4.  **Luôn cung cấp nguồn tham khảo** khi trả lời các câu hỏi về V64.`;

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// --- Function Calling Definition ---
const createDiscountCodeTool: FunctionDeclaration = {
  name: 'createDiscountCode',
  description: 'Tạo một mã giảm giá mới cho một sản phẩm cụ thể.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productName: {
        type: Type.STRING,
        description: 'Tên của sản phẩm cần tạo mã giảm giá.',
      },
      discountPercentage: {
        type: Type.NUMBER,
        description: 'Tỷ lệ phần trăm giảm giá (ví dụ: 15 cho 15%).',
      },
      codeName: {
        type: Type.STRING,
        description: 'Tên mã giảm giá tùy chỉnh (ví dụ: SALE15, HEV64).',
      },
    },
    required: ['productName', 'discountPercentage', 'codeName'],
  },
};


function mapHistoryToContent(history: ChatMessage[]): Content[] {
    return history
      .filter(msg => !msg.isExecuting) // Do not include "executing" messages in history
      .map(msg => {
        const parts: Part[] = [];
        if (msg.image) {
            const base64Data = msg.image.data.split(',')[1];
            if(base64Data){
                parts.push({
                    inlineData: { mimeType: msg.image.mimeType, data: base64Data }
                });
            }
        }
        
        // Handle function calls and responses
        if (msg.toolCall) {
            parts.push({ functionCall: msg.toolCall });
        } else if (msg.role === 'model' && history.find(h => h.toolCall?.name === (msg as any).toolResponse?.name)) {
            // This is a function response, but the SDK expects it in a specific format
            // which is complex to reconstruct. We will rely on the text content instead.
            // For now, let's just push the text part.
            parts.push({ text: msg.content });
        }
        else {
           parts.push({ text: msg.content });
        }
        
        return { role: msg.role, parts: parts };
    });
}


export async function summarizeTitle(firstMessage: string): Promise<string> {
    try {
        const prompt = `Hãy tóm tắt yêu cầu sau thành một tiêu đề ngắn gọn (tối đa 6 từ) bằng tiếng Việt: "${firstMessage}"`;
        const result = await ai.models.generateContent({ model: model, contents: prompt });
        let title = result.text.trim().replace(/["']/g, "");
        title = title.charAt(0).toUpperCase() + title.slice(1);
        return title;
    } catch (error) {
        console.error("Title summarization failed:", error);
        return firstMessage.substring(0, 30) + '...';
    }
}

export interface StreamedChatResponse {
    textChunk?: string;
    sources?: { uri: string; title: string }[];
    functionCall?: FunctionCall;
    isFinal: boolean;
    error?: string;
    performanceMetrics?: {
        timeToFirstChunk: number;
        totalTime: number;
    };
}

// FIX: Export StressTestResult interface for stress testing.
export interface StressTestResult {
    success: boolean;
    error?: string;
    performance?: {
        timeToFirstChunk: number;
        totalTime: number;
    };
}

export async function* getChatResponseStream(
    history: ChatMessage[],
    signal: AbortSignal,
    functionResponse?: {name: string; response: any}
): AsyncGenerator<StreamedChatResponse> {
    const startTime = performance.now();
    let firstChunkTime = 0;

    try {
        if (signal.aborted) return;
        
        const lastMessage = history[history.length - 1];
        if (!lastMessage && !functionResponse) {
            yield { isFinal: true, error: "Lỗi: Không tìm thấy tin nhắn hợp lệ." };
            return;
        }

        const isPricingTask = lastMessage?.content.startsWith('Hãy đóng vai trò là một chuyên gia kinh doanh') || lastMessage?.content.startsWith('Tôi có một nhóm sản phẩm');
        const useMarketData = lastMessage?.content.includes('tham khảo giá thị trường');
        
        const historyForApi = JSON.parse(JSON.stringify(history));
        
        if(functionResponse) {
            historyForApi.push({
                role: 'model', // This is technically a 'tool' role in the new API, but 'model' works here for simplicity
                parts: [{
                    functionResponse: {
                        name: functionResponse.name,
                        response: functionResponse.response
                    }
                }]
            });
        }
        
        // Append site search for non-pricing tasks to ground responses
        if (lastMessage?.role === 'user' && !isPricingTask) {
            const lastUserMessage = historyForApi[historyForApi.length - (functionResponse ? 2 : 1)];
            lastUserMessage.content = `${lastUserMessage.content} site:v64.vn`;
        }
        
        const contents = mapHistoryToContent(historyForApi);

        const shouldUseSearch = useMarketData || !isPricingTask;

        const stream = await ai.models.generateContentStream({
            model: model,
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{
                    functionDeclarations: [createDiscountCodeTool],
                    ...(shouldUseSearch && { googleSearch: {} })
                }],
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
            
            if ((chunk.text || chunk.functionCalls) && firstChunkTime === 0) {
                firstChunkTime = performance.now() - startTime;
            }

            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                // Yield the function call and stop this stream
                yield { functionCall: chunk.functionCalls[0], isFinal: false };
                return;
            }

            const text = chunk.text;
            if (text) {
                yield { textChunk: text, isFinal: false };
            }
        }
        
        const response = await stream.response;
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        if (response) {
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            const sources = groundingChunks
                .map(chunk => chunk.web)
                .filter((web): web is { uri: string; title:string } => !!web?.uri && !!web?.title)
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

// FIX: Add and export runStressTestPrompt function for stress testing.
export async function runStressTestPrompt(prompt: string, signal: AbortSignal): Promise<StressTestResult> {
    const history: ChatMessage[] = [{ role: 'user', content: prompt }];
    
    try {
        const stream = getChatResponseStream(history, signal);
        for await (const chunk of stream) {
            if (chunk.isFinal) {
                if (chunk.error) {
                    return { success: false, error: chunk.error };
                }
                return { 
                    success: true, 
                    performance: chunk.performanceMetrics 
                };
            }
        }
        // This case should ideally not be reached if the stream is well-behaved.
        return { success: false, error: "Stream ended without a final chunk." };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, error: 'Aborted by user.' };
        }
        console.error("Stress test run failed:", error);
        return { success: false, error: error.message || "An unknown error occurred during stress test." };
    }
}
