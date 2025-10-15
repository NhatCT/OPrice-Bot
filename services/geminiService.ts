import { GoogleGenAI, Content, Part, Modality } from "@google/genai";
import type { ChatMessage } from '../types';

const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI chuyên nghiệp của công ty V64. Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng một cách chính xác và ngắn gọn. Khi được yêu cầu tính toán về giá sản phẩm, hãy đóng vai trò là một chuyên gia kinh doanh và đưa ra câu trả lời chi tiết, chuyên nghiệp với các bước tính toán rõ ràng. Với các câu hỏi khác, hãy chỉ dựa trên thông tin được cung cấp từ kết quả tìm kiếm trên trang web v64.vn. Luôn trả lời bằng tiếng Việt. Không đưa ra thông tin không có trong nguồn.`;

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

interface ChatResponse {
    text: string;
    sources: { uri: string; title: string }[];
    image?: {
        data: string; // Data URL for the image
        mimeType: string;
    }
}

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
): Promise<ChatResponse> {
  try {
    const lastMessage = history[history.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return { text: "Lỗi: Không tìm thấy tin nhắn hợp lệ của người dùng.", sources: [] };
    }

    const isPricingTask = lastMessage.content.startsWith('Hãy tính giá') || lastMessage.content.startsWith('Tôi có nhóm sản phẩm');
    
    const historyForApi = JSON.parse(JSON.stringify(history));
    const lastMessageForApi = historyForApi[historyForApi.length - 1];
    
    if (!isPricingTask) {
        lastMessageForApi.content = `${lastMessageForApi.content} site:v64.vn`;
    }
    
    const contents = mapHistoryToContent(historyForApi);

    const textPromise = ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: isPricingTask ? undefined : [{googleSearch: {}}],
      },
    });

    let imagePromise: Promise<any> = Promise.resolve(null);
    const lowercasedContent = lastMessage.content.toLowerCase();
    
    let imagePrompt = '';
    if (!isPricingTask && lowercasedContent.includes('giải pháp')) {
        imagePrompt = 'A professional, abstract image representing innovative business technology solutions. Clean, futuristic aesthetic with data visualizations and circuit patterns. Predominantly blue and white tones.';
    } else if (!isPricingTask && lowercasedContent.includes('dự án')) {
        imagePrompt = 'A dynamic, professional image symbolizing successful project completion and collaboration. Abstract representations of charts, graphs, and teamwork. Modern and inspiring.';
    }

    if (imagePrompt) {
        imagePromise = ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: imagePrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        }).catch(err => {
            console.error("Image generation failed:", err);
            return null; // Gracefully handle failure
        });
    }

    const [textResponse, imageResponse] = await Promise.all([textPromise, imagePromise]);

    const text = textResponse.text;
    const groundingChunks = textResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    
    const sources = groundingChunks
        .map(chunk => chunk.web)
        .filter((web): web is { uri: string; title: string } => !!web?.uri && !!web?.title)
        .filter((value, index, self) =>
            index === self.findIndex((t) => (t.uri === value.uri))
        );

    let imageResult: ChatResponse['image'] | undefined = undefined;
    if (imageResponse && imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            imageResult = {
                data: `data:${mimeType};base64,${base64ImageBytes}`,
                mimeType: mimeType,
            };
            break;
          }
        }
    }
    
    return { text, sources, image: imageResult };

  } catch (error) {
    console.error("Gemini API error:", error);
    return {
        text: "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.",
        sources: []
    };
  }
}