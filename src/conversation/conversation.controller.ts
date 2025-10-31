// @ts-nocheck
import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  findAll() {
    return this.conversationService.findAll();
  }
  
  @Post()
  create() {
    return this.conversationService.create();
  }

  @Put(':id')
  updateMeta(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    return this.conversationService.updateMeta(id, updateConversationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationService.remove(id);
  }
  
  @Get(':id/messages')
  findMessages(@Param('id') id: string) {
    return this.conversationService.findMessages(id);
  }

  @Post(':id/messages')
  saveMessages(@Param('id') id: string, @Body() messages: any[]) {
    return this.conversationService.saveMessages(id, messages);
  }
}
