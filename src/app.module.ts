// @ts-nocheck
import { Module } from '@nestjs/common';
import { ConversationModule } from './conversation/conversation.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [ConversationModule, ChatModule],
})
export class AppModule {}
