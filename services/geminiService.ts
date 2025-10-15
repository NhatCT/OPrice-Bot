import { GoogleGenAI, Content, Part, Modality, FunctionDeclaration, Type, GenerateContentResponse } from "@google/genai";
import type { ChatMessage } from '../types';

const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI chuyên nghiệp của công ty V64. Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng một cách chính xác và ngắn gọn. Khi được yêu cầu tính toán, hãy đóng vai trò là một chuyên gia kinh doanh. Bạn có khả năng phân tích lợi nhuận một cách linh hoạt: tính giá bán cần thiết, doanh số mục tiêu, hoặc lợi nhuận tiềm năng. Khi được yêu cầu "tham khảo giá thị trường", hãy sử dụng công cụ tìm kiếm (Google Search) để tìm các sản phẩm tương tự từ các thương hiệu khác, so sánh giá cả và đưa ra nhận định dựa trên dữ liệu thực tế đó. Với các câu hỏi khác, hãy chỉ dựa trên thông tin được cung cấp từ kết quả tìm kiếm trên trang web v64.vn. Luôn trả lời bằng tiếng Việt. Luôn cung cấp nguồn tham khảo nếu có.`;

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
}

export async function* getChatResponseStream(
    history: ChatMessage[],
    signal: AbortSignal
): AsyncGenerator<StreamedChatResponse> {
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

            const text = chunk.text;
            if (text) {
                yield { textChunk: text, isFinal: false };
            }
        }
        
        // Once the stream is finished, get the complete response to extract grounding sources
        const response = await stream.response;

        if (response) {
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            const sources = groundingChunks
                .map(chunk => chunk.web)
                .filter((web): web is { uri: string; title:string } => !!web?.uri && !!web?.title)
                // Deduplicate sources by URI
                .filter((value, index, self) => index === self.findIndex((t) => (t.uri === value.uri)));
            
            if (sources.length > 0) {
                 yield { sources, isFinal: true }; // Send sources with the final chunk
            } else {
                 yield { isFinal: true };
            }
        } else {
             yield { isFinal: true };
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