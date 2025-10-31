// @ts-nocheck
import { Controller, Post, Body } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { FeedbackDto } from './dto/feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  addFeedback(@Body() feedbackDto: FeedbackDto) {
    return this.conversationService.addFeedback(feedbackDto);
  }
}
