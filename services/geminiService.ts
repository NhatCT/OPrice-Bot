import { GoogleGenAI, Content, Part } from "@google/genai";
import type { ChatMessage } from '../types';

const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI chuyên nghiệp của công ty V64. Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng một cách chính xác và ngắn gọn. Khi được yêu cầu tính toán về giá sản phẩm, hãy đóng vai trò là một chuyên gia kinh doanh và đưa ra câu trả lời chi tiết, chuyên nghiệp với các bước tính toán rõ ràng. Với các câu hỏi khác, hãy chỉ dựa trên thông tin được cung cấp từ kết quả tìm kiếm trên trang web v64.vn. Luôn trả lời bằng tiếng Việt. Không đưa ra thông tin không có trong nguồn.`;

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

function mapHistoryToContent(history: ChatMessage[]): Content[] {
    return history.map(msg => {
        const parts: Part[] = [];

        // Add image part first if it exists
        if (msg.image) {
            // Gemini API expects base64 string without the data URL prefix
            const base64Data = msg.image.data.split(',')[1];
            if(base64Data){
                parts.push({
                    inlineData: {
                        mimeType: msg.image.mimeType,
                        data: base64Data
                    }
                });
            }
        }
        
        // Then, add the text part
        parts.push({ text: msg.content });

        return {
            role: msg.role,
            parts: parts
        };
    });
}

export async function getChatResponse(
    history: ChatMessage[]
): Promise<{ text: string; sources: { uri: string; title: string }[] }> {
  try {
    const lastMessage = history[history.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return { text: "Lỗi: Không tìm thấy tin nhắn hợp lệ của người dùng.", sources: [] };
    }

    const isPricingTask = lastMessage.content.startsWith('Hãy tính giá') || lastMessage.content.startsWith('Tôi có nhóm sản phẩm');
    
    // Create a deep copy to modify for the API call without affecting app state
    const historyForApi = JSON.parse(JSON.stringify(history));
    const lastMessageForApi = historyForApi[historyForApi.length - 1];
    
    // Append search scope for non-pricing tasks
    if (!isPricingTask) {
        lastMessageForApi.content = `${lastMessageForApi.content} site:v64.vn`;
    }
    
    const contents = mapHistoryToContent(historyForApi);

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: isPricingTask ? undefined : [{googleSearch: {}}],
      },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    
    const sources = groundingChunks
        .map(chunk => chunk.web)
        .filter((web): web is { uri: string; title: string } => !!web?.uri && !!web?.title)
        .filter((value, index, self) =>
            index === self.findIndex((t) => (t.uri === value.uri))
        );

    return { text, sources };

  } catch (error) {
    console.error("Gemini API error:", error);
    return {
        text: "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.",
        sources: []
    };
  }
}
