// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatRequestDto } from './dto/chat-request.dto';

@Injectable()
export class ChatService {
  getChatResponseStream(chatRequest: ChatRequestDto): Observable<MessageEvent> {
    const mockResponses = [
        { textChunk: 'Đây ' },
        { textChunk: 'là ' },
        { textChunk: 'một ' },
        { textChunk: 'phản ' },
        { textChunk: 'hồi ' },
        { textChunk: 'mô ' },
        { textChunk: 'phỏng ' },
        { textChunk: 'trực ' },
        { textChunk: 'tiếp ' },
        { textChunk: 'từ ' },
        { textChunk: 'backend ' },
        { textChunk: 'NestJS. ' },
        { isFinal: true, sources: [{ title: 'V64 Homepage', uri: 'https://v64.vn' }], performanceMetrics: { timeToFirstChunk: 150, totalTime: 850 } }
    ];

    return new Observable(subscriber => {
      let index = 0;
      const intervalId = setInterval(() => {
        if (index < mockResponses.length) {
          const chunk = mockResponses[index++];
          subscriber.next({ data: JSON.stringify(chunk) } as MessageEvent);
        } else {
          clearInterval(intervalId);
          subscriber.complete();
        }
      }, 80); // Send a chunk every 80ms to simulate typing

      // Clean up when the client disconnects
      return () => {
        clearInterval(intervalId);
      }
    });
  }
}
