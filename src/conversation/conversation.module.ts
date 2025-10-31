// @ts-nocheck
import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FeedbackController } from './feedback.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ConversationController, FeedbackController],
  providers: [ConversationService],
})
export class ConversationModule {}
