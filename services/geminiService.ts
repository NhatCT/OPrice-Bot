// ✅ FIXED & CLEAN VERSION — compatible with Gemini 2.5 Flash + Vite + Vercel
import {
  GoogleGenAI,
  Content,
  Part,
  FunctionDeclaration,
  Type,
  GenerateContentResponse,
  FunctionCall,
} from "@google/genai";
import type { ChatMessage } from "../types";

// --- Model configuration ---
const model = "gemini-2.5-flash";

// --- System instruction ---
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

// --- API Key setup ---
const ai = new GoogleGenAI({
  apiKey:
    typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY
      ? import.meta.env.VITE_API_KEY
      : process?.env?.API_KEY,
});

// --- Function calling tool ---
const createDiscountCodeTool: FunctionDeclaration = {
  name: "createDiscountCode",
  description: "Tạo một mã giảm giá mới cho một sản phẩm cụ thể.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productName: {
        type: Type.STRING,
        description: "Tên sản phẩm cần tạo mã giảm giá.",
      },
      discountPercentage: {
        type: Type.NUMBER,
        description: "Tỷ lệ phần trăm giảm giá (ví dụ: 15 cho 15%).",
      },
      codeName: {
        type: Type.STRING,
        description: "Tên mã giảm giá (ví dụ: SALE15, HEV64).",
      },
    },
    required: ["productName", "discountPercentage", "codeName"],
  },
};

// --- Schema for pricing analysis responses ---
const chartDataSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Tên danh mục (VD: Doanh thu)." },
    value: { type: Type.NUMBER, description: "Giá trị số của danh mục." },
  },
  required: ["name", "value"],
};

const chartSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["bar"], description: "Loại biểu đồ." },
    title: { type: Type.STRING, description: "Tiêu đề biểu đồ." },
    data: { type: Type.ARRAY, items: chartDataSchema },
  },
  required: ["type", "title", "data"],
};

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "Phân tích chi tiết bằng Markdown.",
    },
    charts: {
      type: Type.ARRAY,
      items: chartSchema,
      description: "Các biểu đồ dữ liệu.",
    },
  },
  required: ["analysis", "charts"],
};

// --- Convert chat history to Gemini input ---
function mapHistoryToContent(history: ChatMessage[]): Content[] {
  return history
    .filter((msg) => !msg.isExecuting)
    .map((msg) => {
      const parts: Part[] = [];
      if (msg.toolCall) {
        parts.push({ functionCall: msg.toolCall });
      } else {
        parts.push({ text: msg.content });
      }
      return { role: msg.role, parts };
    });
}

// --- Summarize title ---
export async function summarizeTitle(firstMessage: string): Promise<string> {
  try {
    const prompt = `Hãy tóm tắt yêu cầu sau thành một tiêu đề ngắn gọn (tối đa 6 từ) bằng tiếng Việt: "${firstMessage}"`;
    const result = await ai.models.generateContent({ model, contents: prompt });
    let title = result.text.trim().replace(/["']/g, "");
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title;
  } catch (error) {
    console.error("Title summarization failed:", error);
    return firstMessage.substring(0, 30) + "...";
  }
}

// --- Response interface ---
export interface StreamedChatResponse {
  textChunk?: string;
  sources?: { uri: string; title: string }[];
  functionCall?: FunctionCall;
  isFinal: boolean;
  error?: string;
  performanceMetrics?: { timeToFirstChunk: number; totalTime: number };
}

// --- Stress test interface ---
export interface StressTestResult {
  success: boolean;
  error?: string;
  performance?: { timeToFirstChunk: number; totalTime: number };
}

// --- Main chat stream ---
export async function* getChatResponseStream(
  history: ChatMessage[],
  signal: AbortSignal,
  functionResponse?: { name: string; response: any }
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

    const isPricingTask =
      lastMessage?.content.startsWith(
        "Hãy đóng vai trò là một chuyên gia kinh doanh"
      ) ||
      lastMessage?.content.startsWith("Tôi có một nhóm sản phẩm") ||
      lastMessage?.content.startsWith(
        "Hãy phân tích hiệu quả cho chương trình khuyến mãi"
      );

    const useMarketData = lastMessage?.content.includes(
      "tham khảo giá thị trường"
    );

    const historyForApi = JSON.parse(JSON.stringify(history));

    if (functionResponse) {
      historyForApi.push({
        role: "model",
        parts: [
          {
            functionResponse: {
              name: functionResponse.name,
              response: functionResponse.response,
            },
          },
        ],
      });
    }

    if (lastMessage?.role === "user" && !isPricingTask) {
      const lastUserMessage =
        historyForApi[historyForApi.length - (functionResponse ? 2 : 1)];
      lastUserMessage.content = `${lastUserMessage.content} site:v64.vn`;
    }

    const contents = mapHistoryToContent(historyForApi);

    // --- ✅ Fixed config logic ---
    const config: any = { systemInstruction: SYSTEM_INSTRUCTION };

    if (isPricingTask && !useMarketData) {
      config.responseMimeType = "application/json";
      config.responseSchema = analysisResponseSchema;
    } else if (useMarketData) {
      config.tools = [{ googleSearch: {} }];
    } else {
      config.tools = [{ functionDeclarations: [createDiscountCodeTool] }];
    }

    console.log("🧩 Gemini config gửi lên:", JSON.stringify(config, null, 2));

    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });

    const signalPromise = new Promise((_, reject) => {
      signal.addEventListener("abort", () =>
        reject(new DOMException("Aborted", "AbortError"))
      );
    });

    const streamIterator = stream[Symbol.asyncIterator]();

    while (true) {
      const { value: chunk, done } = (await Promise.race([
        streamIterator.next(),
        signalPromise,
      ]).catch((e) => {
        throw e;
      })) as IteratorResult<GenerateContentResponse>;

      if (done) break;

      if ((chunk.text || chunk.functionCalls) && firstChunkTime === 0) {
        firstChunkTime = performance.now() - startTime;
      }

      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        yield { functionCall: chunk.functionCalls[0], isFinal: false };
        return;
      }

      const text = chunk.text;
      if (text) yield { textChunk: text, isFinal: false };
    }

    const response = await (stream as any).response;
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    const groundingChunks =
      response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = groundingChunks
      .map((chunk) => chunk.web)
      .filter(
        (web): web is { uri: string; title: string } =>
          !!web?.uri && !!web?.title
      )
      .filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.uri === value.uri)
      );

    yield {
      sources: sources.length > 0 ? sources : undefined,
      isFinal: true,
      performanceMetrics: {
        timeToFirstChunk: Math.round(firstChunkTime),
        totalTime: Math.round(totalTime),
      },
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Stream generation aborted by user.");
      yield { isFinal: true };
      return;
    }
    console.error("Gemini API error:", error);
    yield {
      isFinal: true,
      error:
        "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.",
    };
  }
}

// --- Stress test ---
export async function runStressTestPrompt(
  prompt: string,
  signal: AbortSignal
): Promise<StressTestResult> {
  const history: ChatMessage[] = [{ role: "user", content: prompt }];

  try {
    const stream = getChatResponseStream(history, signal);
    for await (const chunk of stream) {
      if (chunk.isFinal) {
        if (chunk.error) return { success: false, error: chunk.error };
        return {
          success: true,
          performance: chunk.performanceMetrics,
        };
      }
    }
    return { success: false, error: "Stream ended without a final chunk." };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return { success: false, error: "Aborted by user." };
    }
    console.error("Stress test run failed:", error);
    return {
      success: false,
      error: error.message || "An unknown error occurred during stress test.",
    };
  }
}
