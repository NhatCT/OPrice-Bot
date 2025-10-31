// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { FeedbackDto } from './dto/feedback.dto';

// Mock types mirroring the frontend for clarity
interface ConversationMeta {
  id: string;
  title: string;
}
interface ChatMessage {
  id?: number;
  role: 'user' | 'model';
  content: string;
  feedback?: 'positive' | 'negative';
  feedbackComment?: string;
}

// In-memory data store
const conversations: Record<string, { meta: ConversationMeta; messages: ChatMessage[] }> = {};
let nextConvoId = 1;
let nextMessageId = 1;

@Injectable()
export class ConversationService {
    constructor() {
      // Ensure there's always at least one conversation on startup for a better UX
      if (Object.keys(conversations).length === 0) {
        this.create();
      }
    }

    findAll(): ConversationMeta[] {
        return Object.values(conversations).map(c => c.meta);
    }
    
    create(): ConversationMeta {
        const id = (nextConvoId++).toString();
        const newConversation = {
            meta: { id, title: 'Cuộc trò chuyện mới' },
            messages: [],
        };
        conversations[id] = newConversation;
        return newConversation.meta;
    }

    updateMeta(id: string, updateConversationDto: UpdateConversationDto): ConversationMeta {
        const conversation = conversations[id];
        if (!conversation) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }
        conversation.meta.title = updateConversationDto.title;
        return conversation.meta;
    }

    remove(id: string): void {
        if (!conversations[id]) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }
        delete conversations[id];
        return;
    }

    findMessages(id: string): ChatMessage[] {
        const conversation = conversations[id];
        if (!conversation) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }
        return conversation.messages;
    }

    saveMessages(id: string, messages: ChatMessage[]): void {
        const conversation = conversations[id];
        if (!conversation) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }
        // Assign IDs to new model messages for feedback tracking
        conversation.messages = messages.map(msg => ({
            ...msg,
            id: msg.id ?? (msg.role === 'model' ? nextMessageId++ : undefined)
        }));
    }

    addFeedback(feedbackDto: FeedbackDto): void {
        const { messageId, feedback, comment } = feedbackDto;
        for (const convoId in conversations) {
            const message = conversations[convoId].messages.find(m => m.id === messageId);
            if (message) {
                message.feedback = feedback;
                message.feedbackComment = comment;
                return;
            }
        }
        throw new NotFoundException(`Message with ID ${messageId} not found`);
    }
}
