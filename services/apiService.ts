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

        const messagesWithIds = messages.map(msg => {
            // Strip non-serializable React component before saving.
            const { component, ...restOfMsg } = msg as any;

            // Strip large image data before saving to localStorage to avoid quota errors.
            let finalMsg: Partial<ChatMessage> = {
                ...restOfMsg,
                id: msg.id ?? (msg.role ==='model' ? nextMessageId++ : undefined)
            };

            if (finalMsg.marketResearchData && finalMsg.marketResearchData.key_items) {
                finalMsg = {
                    ...finalMsg,
                    marketResearchData: {
                        ...finalMsg.marketResearchData,
                        key_items: finalMsg.marketResearchData.key_items.map((item: any) => {
                            const { image_base64, ...restOfItem } = item; // Remove image_base64
                            return restOfItem;
                        })
                    }
                };
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
        // This is a bit inefficient as it re-reads/re-writes messages, but it's safe
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
        // This is simpler - we just need to update the conversation's meta
        const convos = await loadConversations();
        if (convos[conversationId]) {
            convos[conversationId].groupId = groupId;
            // Directly save the meta file
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

// FIX: The BusinessProfile type uses 'products', not 'frequentProducts'.
// This function is updated to use the correct property name and handle
// backward compatibility for data stored with the old name. It also ensures
// that loaded product objects have all the required fields from the Product type.
export const loadBusinessProfile = async (): Promise<BusinessProfile> => {
    const defaultProfile: BusinessProfile = {
        defaultCosts: {},
        products: [],
    };
    try {
        const data = localStorage.getItem(BUSINESS_PROFILE_KEY);
        if (!data) return defaultProfile;
        
        const profile = JSON.parse(data);
        
        // Handle backward compatibility from 'frequentProducts' to 'products'
        const productList = profile.products || profile.frequentProducts || [];
        
        // Ensure backward compatibility for products that might not have all fields
        profile.products = productList.map((p: any, index: number) => ({
            id: p.id || `${Date.now()}-${index}`,
            sku: p.sku || '',
            name: p.name || '',
            cost: p.cost || '',
            price: p.price || '',
        }));

        // Clean up old property if it exists
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

// FIX: Rewrote keyword matching to use Sets, which is more performant and avoids a type error with `Array.prototype.includes`.
export const findSimilarFineTuningExamples = async (prompt: string, examples: FineTuningExample[]): Promise<FineTuningExample[]> => {
    // Basic keyword matching for now. More advanced logic (e.g., embeddings) could be used.
    const promptKeywords = new Set(prompt.toLowerCase().match(/\b(\w+)\b/g) || []);
    if (promptKeywords.size < 3) return [];

    const relevantExamples = examples.filter(ex => {
        const exampleKeywords = new Set(ex.originalPrompt.toLowerCase().match(/\b(\w+)\b/g) || []);
        const commonKeywords = [...promptKeywords].filter(kw => exampleKeywords.has(kw));
        // Consider it similar if more than 50% of the shorter prompt's keywords match
        const threshold = Math.min(promptKeywords.size, exampleKeywords.size) * 0.5;
        return commonKeywords.length > threshold;
    });

    // Return the most recent 1-2 examples
    return relevantExamples.slice(-2);
};