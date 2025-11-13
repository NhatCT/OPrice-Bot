import { GoogleGenAI, Content } from '@google/genai';
import type { ChatMessage, Task } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("API_KEY is missing. The application will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });


const HARDCODED_SYSTEM_INSTRUCTION = `You are a specialized business assistant for 'V64', a Vietnamese company. You will receive prompts in English. **You MUST ALWAYS RESPOND in ENGLISH.**

You have access to the following V64 2025 costsheet data. Use this data for any relevant business analysis unless the user provides different data.
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
1.  **Answering questions about V64:** Respond to inquiries about the company, its solutions, projects, and related information.
2.  **Performing Business Analysis:** Execute specific business analysis tasks (like profit, promotion, pricing, and market research analysis) based on structured data provided by the user OR the costsheet data above.
3.  **Analyzing Data from Images:** Read, interpret, and perform calculations on data from user-uploaded images (e.g., spreadsheets, reports) to answer their questions.

You MUST adhere to these rules:
- **ALWAYS respond in ENGLISH.** Your entire response, including analysis, summaries, and suggestions, must be in English.
- **Maintain conversational context:** Always refer to previous messages to understand the full context of the user's request. If the user asks a follow-up question like "what is its profit margin?", you must infer "it" refers to the product discussed in the previous message.
- **Be proactive:** If a user's request is ambiguous or lacks necessary details for a complete analysis (e.g., "analyze profit" without specifying a product or providing data), you MUST ask clarifying questions to get the required information before providing an answer.
- If the user's query is outside these defined areas (e.g., general knowledge, weather, chit-chat, personal opinions, cooking recipes, etc.), you MUST politely decline in English.
- When declining, state that you are a specialized assistant for V64 and can only help with business-related tasks or information about the company. Do not suggest other tools or search engines.
- After every response, you MUST suggest 2-3 relevant follow-up questions for the user. These suggestions should be in English. Format them as [SUGGESTION]Question text[/SUGGESTION] and place them at the very end of your response.`;


const CREATIVE_SYSTEM_INSTRUCTION = `You are a world-class Fashion Trend Analyst and Creative Director. Your tone is sharp, insightful, and inspiring. You provide detailed analysis and actionable creative direction for a fashion brand's product development team. You must refer to previous parts of the conversation to build upon ideas and maintain a coherent creative dialogue.`;

interface StreamChunk {
    textChunk?: string;
    sources?: { uri: string; title: string }[];
    performanceMetrics?: { timeToFirstChunk: number; totalTime: number };
    suggestions?: string[];
    isFinal?: boolean;
    error?: string;
}

const handleGeminiError = (e: any): string => {
    console.error("Gemini API call failed:", e);
    let errorMessage = "Đã có lỗi xảy ra khi gọi Gemini API. Vui lòng thử lại sau.";
    if (e instanceof Error || (typeof e === 'object' && e !== null && 'message' in e)) {
        const message = (e as Error).message;
        // Check for specific rate-limit error messages
        if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
             errorMessage = `Bạn đã vượt quá hạn ngạch sử dụng API miễn phí. Vui lòng kiểm tra gói cước và chi tiết thanh toán của bạn.\n\n- **Để theo dõi mức sử dụng:** [Truy cập Google AI Studio](https://ai.dev/usage)\n- **Để tìm hiểu thêm về giới hạn:** [Xem tài liệu Gemini API](https://ai.google.dev/gemini-api/docs/rate-limits)`;
        } else if (e.name === 'AbortError') {
            errorMessage = 'Yêu cầu đã bị hủy.';
        }
    }
    return errorMessage;
};

export async function* getChatResponseStream(
    history: ChatMessage[],
    signal: AbortSignal,
    options: { task?: Task; useCreativePersona?: boolean } = {}
): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    let firstChunkTime: number | null = null;
    
    const contents: Content[] = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.role === 'user' ? msg.rawPrompt || msg.content : msg.content }]
    }));
    
    const systemInstruction = options.useCreativePersona ? CREATIVE_SYSTEM_INSTRUCTION : HARDCODED_SYSTEM_INSTRUCTION;

    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
                tools: [{googleSearch: {}}]
            },
            history: contents.slice(0, -1)
        });

        const lastMessage = contents[contents.length-1];
        if (!lastMessage) throw new Error("No message to send");

        const stream = await chat.sendMessageStream({ message: lastMessage.parts[0].text ?? '' });

        let groundingChunks: any[] = [];

        for await (const chunk of stream) {
            if (signal.aborted) {
                console.log("Stream aborted by user.");
                return;
            }
            if (!firstChunkTime) {
                firstChunkTime = Date.now() - startTime;
            }

            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                groundingChunks.push(...chunk.candidates[0].groundingMetadata.groundingChunks);
            }

            yield { textChunk: chunk.text };
        }
        
        const totalTime = Date.now() - startTime;
        
        const sources = groundingChunks
            .map(c => c.web)
            .filter(Boolean)
            .map(s => ({ uri: s.uri, title: s.title }))
            .filter((s, i, arr) => arr.findIndex(t => t.uri === s.uri) === i); // Deduplicate

        yield {
            isFinal: true,
            performanceMetrics: { timeToFirstChunk: firstChunkTime || totalTime, totalTime },
            sources: sources,
        };

    } catch (e: any) {
         if (e.name === 'AbortError') {
            return; // Don't yield an error chunk if the user aborted
        }
        yield { error: handleGeminiError(e), isFinal: true };
    }
}

export async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
    if (!text) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any introductory phrases or quotes: "${text}"`,
        });
        return response.text.trim();
    } catch (e) {
        console.warn("Gemini translation failed, falling back to MyMemory API. Error:", e);
        try {
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
            if (!response.ok) throw new Error('MyMemory API request failed');
            const data = await response.json();
            if (data.responseData?.translatedText) {
                console.log("Successfully translated with MyMemory fallback.");
                return data.responseData.translatedText;
            }
            throw new Error('MyMemory translation was invalid.');
        } catch (fallbackError) {
            console.error("MyMemory fallback also failed:", fallbackError);
            return text; // Return original text if all fails
        }
    }
}


export async function findImageFromSearchQuery(query: string): Promise<string[]> {
    console.log(`Finding image URLs for query: "${query}"`);

    // Synchronous fallbacks that are always generated
    const simplifiedQuery = query.replace(/style of .*|inspired by .*/i, '').replace(/FW\d{2}/i, '').replace(/collection/i, '').split(',').slice(0, 5).join(',');
    const unsplashQuery = query.replace(/photo of a woman wearing|photo of a model wearing|editorial photo|runway look/gi, '').replace(/FW\d{2}/i, '').split(',').slice(0, 3).join(',');
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`realistic fashion photo, ${simplifiedQuery}, editorial lighting, ultra high quality`)}`;
    const unsplashUrl = `https://source.unsplash.com/500x750/?fashion,style,${encodeURIComponent(unsplashQuery)}`;

    // Add timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
        // Primary async attempt: Lexica, using a reliable CORS proxy to ensure reliability
        const lexicaApiUrl = `https://lexica.art/api/v1/search?q=${encodeURIComponent(query)}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(lexicaApiUrl)}`;
        
        const lexicaRes = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId); // Clear timeout if fetch is successful

        if (lexicaRes.ok) {
            const data = await lexicaRes.json();
            const img = data?.images?.[0]?.src || data?.images?.[0]?.srcSmall;
            if (img) {
                // Prioritize Lexica, but keep the others as backup for the frontend component
                return [img, pollinationsUrl, unsplashUrl];
            }
        }
    } catch (err) {
        clearTimeout(timeoutId); // Clear timeout on error too
        console.warn("Lexica search failed, will rely on fallbacks:", err);
    }

    // If Lexica fails, return only the synchronous fallbacks
    return [pollinationsUrl, unsplashUrl];
}


export interface StressTestResult {
    success: boolean;
    error?: string;
    performance?: {
        timeToFirstChunk: number;
        totalTime: number;
    };
}

export const runStressTestPrompt = async (prompt: string, signal: AbortSignal): Promise<StressTestResult> => {
    const startTime = Date.now();
    let firstChunkTime: number | null = null;
    
    try {
        const stream = getChatResponseStream([{ role: 'user', content: prompt }], signal);
        for await (const chunk of stream) {
            if (signal.aborted) throw new Error("Aborted");
            if (chunk.error) {
                // Check for specific error content
                if (chunk.error.includes("hạn ngạch")) {
                    throw new Error("Đã vượt quá giới hạn sử dụng API");
                }
                throw new Error(chunk.error);
            }
            if (!firstChunkTime) {
                firstChunkTime = Date.now() - startTime;
            }
        }
        const totalTime = Date.now() - startTime;
        return {
            success: true,
            performance: {
                timeToFirstChunk: firstChunkTime || totalTime,
                totalTime,
            },
        };
    } catch (e: any) {
        return { success: false, error: e.message || 'Unknown error' };
    }
};

export const createFineTuningExampleFromCorrection = async (
    originalPrompt: string,
    originalResponse: string,
    correctedResponse: string
): Promise<string | null> => {
    try {
        const prompt = `Based on the user's correction, generate an ideal response for the original prompt.
        Original Prompt: "${originalPrompt}"
        Original AI Response: "${originalResponse}"
        User's Corrected Response: "${correctedResponse}"
        
        Generate the new, improved response that incorporates the correction. Only output the response text.`;

        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt
        });

        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate fine-tuning example:", error);
        return null;
    }
};