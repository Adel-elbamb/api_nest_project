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
    //    casheOnline users 
    // async addOnlineUser(userId: string, socketId: string) {
    //     const users = (await this.cacheManager.get<Record<string, string>>('onlineUsers')) || {};
    //     users[userId] = socketId;
    //     await this.cacheManager.set('onlineUsers', users);
    //     console.log('Online users:', users);
    // }

    // async removeOnlineUser(userId: string) {
    //     const users = (await this.cacheManager.get<Record<string, string>>('onlineUsers')) || {};
    //     delete users[userId];
    //     await this.cacheManager.set('onlineUsers', users);
    // }

    async getOnlineUsers() {
        const users = await this.cacheManager.get('onlineUsers');
        console.log('🧠 Online users from Redis:', users);
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


    //// test cache 
    async testCache() {
        // store data
        await this.cacheManager.set('name', 'Adel', 60 * 5); // expires in 5 mins
        // get data
        const value = await this.cacheManager.get('name');
        console.log('🟢 Value from Redis:', value);
        return value;
    }


}
