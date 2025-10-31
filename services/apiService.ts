import type { UserProfile, ConversationMeta, ChatMessage } from '../types';

// Client-side implementation using localStorage
const USER_PROFILE_KEY = 'v64_chat_user_profile';
const CONVERSATIONS_META_KEY = 'v64_conversations_meta';
const getConvoMessagesKey = (id: string) => `v64_convo_messages_${id}`;

// Helper to get all conversations from localStorage
const getAllConversations = (): Record<string, { meta: ConversationMeta; messages: ChatMessage[] }> => {
    const metaRecord = JSON.parse(localStorage.getItem(CONVERSATIONS_META_KEY) || '{}');
    const fullConversations: Record<string, { meta: ConversationMeta; messages: ChatMessage[] }> = {};
    for (const id in metaRecord) {
        const messages = JSON.parse(localStorage.getItem(getConvoMessagesKey(id)) || '[]');
        fullConversations[id] = { meta: metaRecord[id], messages };
    }
    return fullConversations;
};

// Helper to save all conversations to localStorage
const saveAllConversations = (conversations: Record<string, { meta: ConversationMeta; messages: ChatMessage[] }>) => {
    const metaRecord: Record<string, ConversationMeta> = {};
    for (const id in conversations) {
        metaRecord[id] = conversations[id].meta;
        localStorage.setItem(getConvoMessagesKey(id), JSON.stringify(conversations[id].messages));
    }
    localStorage.setItem(CONVERSATIONS_META_KEY, JSON.stringify(metaRecord));
};


export const loadUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const data = localStorage.getItem(USER_PROFILE_KEY);
        return data ? JSON.parse(data) : { name: '' };
    } catch (e) {
        console.error("Failed to load user profile from localStorage", e);
        return { name: '' };
    }
};

export const saveUserProfile = async (profile: UserProfile): Promise<{ success: boolean }> => {
     try {
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
        return { success: true };
    } catch (e) {
        console.error("Failed to save user profile to localStorage", e);
        return { success: false };
    }
};

export const loadConversations = async (): Promise<Record<string, ConversationMeta>> => {
    try {
        return JSON.parse(localStorage.getItem(CONVERSATIONS_META_KEY) || '{}');
    } catch (error) {
        console.error("Error loading conversations:", error);
        return {};
    }
};

export const createNewConversation = async (): Promise<ConversationMeta | null> => {
    try {
        const conversations = getAllConversations();
        const id = (Date.now()).toString();
        const newConversationMeta: ConversationMeta = { id, title: 'Cuộc trò chuyện mới' };
        conversations[id] = { meta: newConversationMeta, messages: [] };
        saveAllConversations(conversations);
        return newConversationMeta;
    } catch (error) {
        console.error("Error creating new conversation:", error);
        return null;
    }
};

export const saveConversationMeta = async (id: string, meta: Partial<ConversationMeta>): Promise<{ success: boolean }> => {
    try {
        const conversations = getAllConversations();
        if (!conversations[id]) return { success: false };
        conversations[id].meta = { ...conversations[id].meta, ...meta };
        saveAllConversations(conversations);
        return { success: true };
    } catch (error) {
        console.error("Error renaming conversation:", error);
        return { success: false };
    }
};

export const deleteConversation = async (id: string): Promise<{ success: boolean }> => {
    try {
        const conversations = getAllConversations();
        if (!conversations[id]) return { success: false };
        delete conversations[id];
        localStorage.removeItem(getConvoMessagesKey(id));
        saveAllConversations(conversations); // This saves the meta record without the deleted one
        return { success: true };
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return { success: false };
    }
};

export const loadMessages = async (id: string): Promise<ChatMessage[]> => {
    try {
        return JSON.parse(localStorage.getItem(getConvoMessagesKey(id)) || '[]');
    } catch (error) {
        console.error(`Error loading messages for conversation ${id}:`, error);
        return [];
    }
};

export const saveMessages = async (id: string, messages: ChatMessage[]): Promise<{ success: boolean }> => {
     try {
        const conversations = getAllConversations();
        if (!conversations[id]) {
            // If conversation meta doesn't exist, create it.
            // This might happen in some edge cases.
            conversations[id] = { meta: { id, title: "Cuộc trò chuyện mới" }, messages: [] };
        };

        // Assign IDs to new model messages for feedback tracking
        let nextMessageId = 1;
        const existingIds = messages.map(m => m.id).filter(Boolean);
        if(existingIds.length > 0) {
            nextMessageId = Math.max(...existingIds as number[]) + 1;
        }

        const messagesWithIds = messages.map(msg => ({
            ...msg,
            id: msg.id ?? (msg.role === 'model' ? nextMessageId++ : undefined)
        }));
        
        conversations[id].messages = messagesWithIds;
        saveAllConversations(conversations);
        return { success: true };
    } catch (error) {
        console.error("Error saving messages:", error);
        return { success: false };
    }
};

export const clearConversationMessages = async (id: string): Promise<{ success: boolean }> => {
    return saveMessages(id, []);
};

export const sendFeedback = async (feedbackData: { messageId: number; feedback: 'positive' | 'negative'; comment?: string }): Promise<{ success: boolean }> => {
    try {
        const { messageId, feedback, comment } = feedbackData;
        const conversations = getAllConversations();
        for (const convoId in conversations) {
            const convo = conversations[convoId];
            const messageIndex = convo.messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1) {
                convo.messages[messageIndex].feedback = feedback;
                convo.messages[messageIndex].feedbackComment = comment;
                saveAllConversations(conversations);
                return { success: true };
            }
        }
        console.error(`Message with ID ${messageId} not found for feedback`);
        return { success: false };
    } catch (error) {
        console.error("Error sending feedback:", error);
        return { success: false };
    }
};