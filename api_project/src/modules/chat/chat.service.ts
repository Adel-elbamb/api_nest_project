// src/modules/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../../Schemas/message.schema';


@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    ) { }

    async saveMessage(senderId: string, receiverId: string, content: string) {
        const message = new this.messageModel({
            sender: new Types.ObjectId(senderId),
            receiver: new Types.ObjectId(receiverId),
            content,
        });
        console.log('Saving message:', message);
        return message.save();
    }

    async getMessages(senderId: string, receiverId: string) {
        return this.messageModel
            .find({
                $or: [
                    { sender: senderId, receiver: receiverId },
                    { sender: receiverId, receiver: senderId },
                ],
            })
            .sort({ createdAt: 1 })
            .populate('sender receiver', 'username email');
    }
}
