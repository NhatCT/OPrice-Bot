import type { UserProfile, ConversationMeta, ChatMessage, ConversationGroup, BusinessProfile, FineTuningExample } from '../types';

// Client-side implementation using localStorage
const USER_PROFILE_KEY = 'v64_chat_user_profile';
const CONVERSATIONS_META_KEY = 'v64_conversations_meta';
const CONVERSATION_GROUPS_KEY = 'v64_conversation_groups';
const BUSINESS_PROFILE_KEY = 'v64_business_profile';
const FINE_TUNING_EXAMPLES_KEY = 'v64_fine_tuning_examples';
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
        try {
            localStorage.setItem(getConvoMessagesKey(id), JSON.stringify(conversations[id].messages));
        } catch (error) {
            console.error(`Error saving messages for convo ${id}:`, error);
            // Handle quota exceeded error if necessary
            if ((error as DOMException).name === 'QuotaExceededError') {
                 console.error(`Quota exceeded for conversation ${id}. Consider clearing some data.`);
            }
        }
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
        const newConversationMeta: ConversationMeta = { id, title: 'Cuộc trò chuyện mới', groupId: null };
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
            conversations[id] = { meta: { id, title: "Cuộc trò chuyện mới", groupId: null }, messages: [] };
        };

        let nextMessageId = 1;
        const existingIds = messages.map(m => m.id).filter(id => id != null) as number[];
        if(existingIds.length > 0) {
            nextMessageId = Math.max(...existingIds) + 1;
        }

        const messagesWithIds = messages.map(msg => {
            const { component, ...restOfMsg } = msg as any;
            
            let finalMsg: Partial<ChatMessage> = {
                ...restOfMsg,
                id: msg.id ?? nextMessageId++
            };

            // Strip large, non-essential data before saving to prevent quota errors
            if (finalMsg.marketResearchData?.trend_sections) {
                finalMsg.marketResearchData.trend_sections.forEach(section => {
                    section.key_items.forEach(item => {
                        delete (item as any).image_base64; // Deprecated but might exist in old data
                        delete (item as any).image_url; // Remove dynamic URL to save space
                    });
                });
            }

            return finalMsg;
        });
        
        conversations[id].messages = messagesWithIds as ChatMessage[];
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

// --- Conversation Group Functions ---

export const loadConversationGroups = async (): Promise<Record<string, ConversationGroup>> => {
    try {
        return JSON.parse(localStorage.getItem(CONVERSATION_GROUPS_KEY) || '{}');
    } catch (error) {
        console.error("Error loading conversation groups:", error);
        return {};
    }
};

export const saveConversationGroups = async (groups: Record<string, ConversationGroup>): Promise<{ success: boolean }> => {
    try {
        localStorage.setItem(CONVERSATION_GROUPS_KEY, JSON.stringify(groups));
        return { success: true };
    } catch (error) {
        console.error("Error saving conversation groups:", error);
        return { success: false };
    }
};

export const createConversationGroup = async (name: string): Promise<ConversationGroup | null> => {
    try {
        const groups = await loadConversationGroups();
        const id = `group_${Date.now()}`;
        const newGroup: ConversationGroup = { id, name };
        groups[id] = newGroup;
        await saveConversationGroups(groups);
        return newGroup;
    } catch (error) {
        console.error("Error creating new group:", error);
        return null;
    }
};

export const renameConversationGroup = async (id: string, newName: string): Promise<{ success: boolean }> => {
    try {
        const groups = await loadConversationGroups();
        if (groups[id]) {
            groups[id].name = newName;
            await saveConversationGroups(groups);
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error("Error renaming group:", error);
        return { success: false };
    }
};

export const deleteConversationGroup = async (id: string): Promise<{ success: boolean }> => {
    try {
        // First, remove the group itself
        const groups = await loadConversationGroups();
        if (!groups[id]) return { success: false }; // Group doesn't exist
        delete groups[id];
        await saveConversationGroups(groups);

        // Then, unassign conversations from the deleted group
        const conversationsMeta = await loadConversations();
        Object.values(conversationsMeta).forEach(convo => {
            if (convo.groupId === id) {
                convo.groupId = null;
            }
        });
        const fullConversations = getAllConversations();
        Object.keys(fullConversations).forEach(convoId => {
            if (fullConversations[convoId].meta.groupId === id) {
                fullConversations[convoId].meta.groupId = null;
            }
        });
        saveAllConversations(fullConversations);

        return { success: true };
    } catch (error) {
        console.error("Error deleting group:", error);
        return { success: false };
    }
};


export const assignConversationToGroup = async (conversationId: string, groupId: string | null): Promise<{ success: boolean }> => {
    try {
        const convos = await loadConversations();
        if (convos[conversationId]) {
            convos[conversationId].groupId = groupId;
            localStorage.setItem(CONVERSATIONS_META_KEY, JSON.stringify(convos));
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error("Error assigning conversation to group:", error);
        return { success: false };
    }
};

// --- Business Profile Functions ---

export const loadBusinessProfile = async (): Promise<BusinessProfile> => {
    const defaultProfile: BusinessProfile = {
        defaultCosts: {},
        products: [],
    };
    try {
        const data = localStorage.getItem(BUSINESS_PROFILE_KEY);
        if (!data) return defaultProfile;
        
        const profile = JSON.parse(data);
        
        const productList = profile.products || profile.frequentProducts || [];
        
        profile.products = productList.map((p: any, index: number) => ({
            id: p.id || `${Date.now()}-${index}`,
            sku: p.sku || '',
            name: p.name || '',
            cost: p.cost || '',
            price: p.price || '',
        }));

        if (profile.frequentProducts) {
            delete profile.frequentProducts;
        }

        return { ...defaultProfile, ...profile };
    } catch (e) {
        console.error("Failed to load business profile from localStorage", e);
        return defaultProfile;
    }
};

export const saveBusinessProfile = async (profile: BusinessProfile): Promise<{ success: boolean }> => {
     try {
        localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(profile));
        return { success: true };
    } catch (e) {
        console.error("Failed to save business profile to localStorage", e);
        return { success: false };
    }
};

// --- Fine-Tuning Functions ---

export const loadFineTuningExamples = async (): Promise<FineTuningExample[]> => {
    try {
        const data = localStorage.getItem(FINE_TUNING_EXAMPLES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load fine-tuning examples", e);
        return [];
    }
};

export const saveFineTuningExample = async (example: FineTuningExample): Promise<{ success: boolean }> => {
    try {
        const examples = await loadFineTuningExamples();
        examples.push(example);
        localStorage.setItem(FINE_TUNING_EXAMPLES_KEY, JSON.stringify(examples));
        return { success: true };
    } catch (e) {
        console.error("Failed to save fine-tuning example", e);
        return { success: false };
    }
};

export const findSimilarFineTuningExamples = async (prompt: string, examples: FineTuningExample[]): Promise<FineTuningExample[]> => {
    const promptKeywords = new Set(prompt.toLowerCase().match(/\b(\w+)\b/g) || []);
    if (promptKeywords.size < 3) return [];

    const relevantExamples = examples.filter(ex => {
        const exampleKeywords = new Set(ex.originalPrompt.toLowerCase().match(/\b(\w+)\b/g) || []);
        const commonKeywords = [...promptKeywords].filter(kw => exampleKeywords.has(kw));
        const threshold = Math.min(promptKeywords.size, exampleKeywords.size) * 0.5;
        return commonKeywords.length > threshold;
    });

    return relevantExamples.slice(-2);
};