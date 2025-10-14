import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WsException } from '@nestjs/websockets';
import { Message, MessageDocument } from './../../Schemas/message.schema';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    async getOnlineUsers() {
        const users = await this.cacheManager.get('onlineUsers');
        return users || {};
    }

    //   message operations 
    async saveMessage(senderId: string, receiverId: string, message: string) {
        return this.messageModel.create({ senderId, receiverId, message });
    }

    async getMessagesBetween(senderId: string, receiverId: string) {
        return this.messageModel.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        })
            .sort({ createdAt: 1 }); 
    }

    async editMessage(messageId: string, userId: string, newMessage: string) {
        const message = await this.messageModel.findById(messageId);
        if (!message) throw new WsException('Message not found');

        if (message.senderId.toString() !== userId)
            throw new WsException('You can only edit your own messages');

        message.message = newMessage;
      

        await message.save();
        console.log('Message edited:', message);
        return message;
    }

    async deleteMessage(messageId: string, userId: string) {
        const message = await this.messageModel.findById(messageId);
        if (!message) throw new WsException('Message not found');

        if (message.senderId.toString() !== userId)
            throw new WsException('You can only delete your own messages');

        await message.deleteOne();
        console.log("Message deleted:", message);
        return message;
    }




}
