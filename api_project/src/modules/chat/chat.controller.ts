import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Get(':user1/:user2')
    async getMessages(@Param('user1') user1: string, @Param('user2') user2: string) {
        return this.chatService.getMessagesBetween(user1, user2);
    }

    @Get('online-users')
    async getOnlineUsers() {
        return  await this.chatService.getOnlineUsers();
       
    }

    @Get('test-cache')
    async testCache() {
        return await this.chatService.testCache();
    }
}
