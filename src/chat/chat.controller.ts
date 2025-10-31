// @ts-nocheck
import { Controller, Post, Body, Sse } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { Observable } from 'rxjs';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse()
  @Post()
  getChatResponseStream(@Body() chatRequestDto: ChatRequestDto): Observable<MessageEvent> {
    return this.chatService.getChatResponseStream(chatRequestDto);
  }
}
