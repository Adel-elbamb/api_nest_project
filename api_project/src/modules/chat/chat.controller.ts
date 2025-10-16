import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Types } from 'mongoose';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get(':id')
    async getConversation(@Param('id') conversationId: string) {
        // Convert string to ObjectId
        const objectId = new Types.ObjectId(conversationId);
        return this.chatService.getConversationById(objectId);
    }

    @Get('/onusers')
    async getallUsers() {
        return this.chatService.getOnlineUsers()
    }


}