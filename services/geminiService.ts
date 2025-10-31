// FIX: Removed IteratorResult from the import as it's a global TypeScript type.
import { GoogleGenAI, Content, Part, FunctionDeclaration, Type, GenerateContentResponse, FunctionCall } from "@google/genai";
import type { ChatMessage } from "../types";

// --- MODEL ---
const model = "gemini-2.5-flash";

// --- SYSTEM INSTRUCTION ---
const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI chuyên nghiệp của công ty V64, chuyên hỗ trợ các vấn đề liên quan đến V64, phân tích kinh doanh và thực thi các tác vụ được yêu cầu.

**QUY TẮC CỰC KỲ QUAN TRỌNG (BẮT BUỘC TUÂN THỦ):**
1.  **PHẠM VI NHIỆM VỤ:** Nhiệm vụ của bạn bao gồm:
    *   **Thông tin về công ty V64:** giải pháp, dự án, tin tức, v.v., dựa trên tìm kiếm từ website v64.vn.
    *   **Phân tích kinh doanh:** thực hiện các bài toán tính giá, lợi nhuận, khuyến mãi. Khi thực hiện các tác vụ này, bạn **PHẢI** trả về kết quả dưới dạng JSON theo schema được cung cấp, bao gồm cả phần văn bản phân tích và dữ liệu để vẽ biểu đồ trực quan.
    *   **Thực thi tác vụ:** Khi người dùng yêu cầu một hành động cụ thể (như "tạo", "cập nhật", "gửi"), hãy sử dụng các công cụ (functions) được cung cấp.
    Nếu người dùng hỏi bất kỳ câu hỏi nào khác ngoài phạm vi trên, bạn **TUYỆT ĐỐI KHÔNG ĐƯỢC TRẢ LỜI**. Thay vào đó, hãy lịch sự từ chối.

2.  **Nguồn thông tin V64:** Mọi câu trả lời về V64 phải dựa trên kết quả tìm kiếm từ trang web \`v64.vn\`. Luôn luôn sử dụng công cụ tìm kiếm được cung cấp.

3.  **Luôn trả lời bằng tiếng Việt.**
4.  **Luôn cung cấp nguồn tham khảo** khi trả lời các câu hỏi về V64.`;

// --- API KEY FIX: hỗ trợ cả Google AI Studio, local, Vercel ---
// FIX: Cast import.meta to 'any' to resolve TypeScript error with Vite environment variables.
const ai = new GoogleGenAI({
  apiKey:
    typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_KEY
      ? (import.meta as any).env.VITE_API_KEY
      : process?.env?.API_KEY || "",
});

// --- Schema cho JSON output ---
const chartDataSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    value: { type: Type.NUMBER },
  },
  required: ["name", "value"],
};

const chartSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["bar"], description: "Loại biểu đồ" },
    title: { type: Type.STRING, description: "Tiêu đề biểu đồ" },
    data: { type: Type.ARRAY, items: chartDataSchema },
  },
  required: ["type", "title", "data"],
};

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING, description: "Phân tích chi tiết bằng Markdown" },
    charts: { type: Type.ARRAY, items: chartSchema },
  },
  required: ["analysis", "charts"],
};

// --- Chuyển đổi lịch sử chat thành nội dung ---
function mapHistoryToContent(history: ChatMessage[]): Content[] {
  return history
    .map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
}

// --- Tóm tắt tiêu đề ---
export async function summarizeTitle(firstMessage: string): Promise<string> {
  try {
    const prompt = `Hãy tóm tắt yêu cầu sau thành một tiêu đề ngắn (≤6 từ) bằng tiếng Việt: "${firstMessage}"`;
    const result = await ai.models.generateContent({ model, contents: prompt });
    let title = result.text.trim().replace(/["']/g, "");
    return title.charAt(0).toUpperCase() + title.slice(1);
  } catch (error) {
    console.error("Title summarization failed:", error);
    return firstMessage.substring(0, 30) + "...";
  }
}

// --- Interface phản hồi ---
export interface StreamedChatResponse {
  textChunk?: string;
  sources?: { uri: string; title: string }[];
  isFinal: boolean;
  error?: string;
  performanceMetrics?: { timeToFirstChunk: number; totalTime: number };
}

// FIX: Add and export StressTestResult type to be used by the stress test runner.
export interface StressTestResult {
  success: boolean;
  error?: string;
  performance?: { timeToFirstChunk: number; totalTime: number };
}

// --- Main Stream Function ---
export async function* getChatResponseStream(
  history: ChatMessage[],
  signal: AbortSignal,
): AsyncGenerator<StreamedChatResponse> {
  const startTime = performance.now();
  let firstChunkTime = 0;

  try {
    if (signal.aborted) return;

    const lastMessage = history[history.length - 1];
    if (!lastMessage) {
      yield { isFinal: true, error: "Không có tin nhắn hợp lệ." };
      return;
    }

    const useMarketData = lastMessage?.content.includes("tham khảo giá thị trường");

    const contents = mapHistoryToContent(history);

    // --- Cấu hình cho Gemini ---
    const config: any = { systemInstruction: SYSTEM_INSTRUCTION };
    
    // Set tools based on the task type
    if (useMarketData) {
      // For market analysis, only use Google Search. The prompt will handle JSON formatting.
      config.tools = [{ googleSearch: {} }];
    }
    // For other analysis tasks without market data, no specific tool is needed;
    // the prompt will instruct the model to return JSON via the prompt itself.


    const stream = await ai.models.generateContentStream({ model, contents, config });
    const iterator = stream[Symbol.asyncIterator]();

    while (true) {
      const { value: chunk, done } = (await Promise.race([
        iterator.next(),
        new Promise((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")))),
      ])) as IteratorResult<GenerateContentResponse>;

      if (done) break;

      if (chunk.text && firstChunkTime === 0)
        firstChunkTime = performance.now() - startTime;

      if (chunk.text) yield { textChunk: chunk.text, isFinal: false };
    }

    const response = await (stream as any).response;
    const totalTime = performance.now() - startTime;

    yield {
      sources: response?.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((c: any) => c.web)
        ?.filter((w: any) => !!w?.uri && !!w?.title),
      isFinal: true,
      performanceMetrics: {
        timeToFirstChunk: Math.round(firstChunkTime),
        totalTime: Math.round(totalTime),
      },
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      yield { isFinal: true };
      return;
    }
    console.error("Gemini API error:", error);
    yield { isFinal: true, error: "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau." };
  }
}

// --- Stress Test Helper ---
// FIX: Update runStressTestPrompt to return performance metrics and use the StressTestResult type.
export async function runStressTestPrompt(prompt: string, signal: AbortSignal): Promise<StressTestResult> {
  try {
    const stream = getChatResponseStream([{ role: "user", content: prompt }], signal);
    for await (const chunk of stream) {
      if (chunk.isFinal) {
        return { 
          success: !chunk.error, 
          error: chunk.error,
          performance: chunk.performanceMetrics,
        };
      }
    }
    return { success: false, error: "Stream ended unexpectedly." };
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error." };
  }
}