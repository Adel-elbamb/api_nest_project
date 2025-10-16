import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WsException } from '@nestjs/websockets';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Message, MessageDocument } from "src/Schemas/message.schema";
import { Conversation, ConversationDocument } from 'src/Schemas/Converstion.schema';
import { ConnectedUser, ConnectedUserDocument } from 'src/Schemas/ConnectedUser.schema';
import { MessageDto } from './Dtos/messageDto.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
        @InjectModel(ConnectedUser.name) private connectedUserModel: Model<ConnectedUserDocument>,
    ) { }

    //=======================================MASSAGE ====================================
    /**  Save message and create conversation if needed */
    async saveMessage(senderId: Types.ObjectId, receiverId: Types.ObjectId, message: string, role: string): Promise<MessageDto> {
        let conversation;

        if (role === 'user') {
            conversation = await this.conversationModel.findOne({
                $or: [
                    { userId: senderId, assignedTo: receiverId },
                    { userId: receiverId, assignedTo: senderId },
                ],
            });
            let myConversion = await this.conversationModel.findOne({
                userId: senderId,
            });

            if (!conversation && !myConversion) {
                conversation = await this.conversationModel.create({
                    userId: senderId,
                    assignedTo: receiverId,
                });
            }
        }
        else if (role === 'agent') {
            conversation = await this.conversationModel.findOne({
                $or: [
                    { userId: senderId, assignedTo: receiverId },
                    { userId: receiverId, assignedTo: senderId },
                ],
            });

            if (!conversation) {
                conversation = await this.conversationModel.create({
                    userId: receiverId,
                    assignedTo: senderId,
                });
            }
        }

        const newMessage = await this.messageModel.create({
            senderId,
            receiverId,
            conversationId: conversation._id,
            message,
        });

        return newMessage;
    }



    /**  Edit message content */
    async editMessage(messageId: Types.ObjectId, senderId: Types.ObjectId, newMessage: string) {
        const message = await this.messageModel.findOne({
            _id: messageId,
            senderId,
            isDeleted: false,
        });
        // console.log(message)

        if (!message) return null;

        message.message = newMessage;
        await message.save();

        return message.populate(['senderId', 'receiverId']);
    }

    /**  Soft delete message */
    async deleteMessage(messageId: Types.ObjectId, senderId: Types.ObjectId) {
        const message = await this.messageModel.findOne({
            _id: messageId,
            senderId,
            isDeleted: false,
        });

        if (!message) return null;

        message.isDeleted = true;
        await message.save();

        return message.populate(['senderId', 'receiverId']);
    }


    /**  Get receiver's socket ID */
    async getReceiverSocketId(userId: Types.ObjectId): Promise<string | null> {
        const connected = await this.connectedUserModel.findOne({ userId: userId });
        return connected ? connected.socketId : null;
    }



    //=================================Online USER============================================

    /**  Set online user (store or update connection) */
    async setOnlineUser(userId: Types.ObjectId, socketId: string, userName: string) {
        let connected = await this.connectedUserModel.findOne({ userId: userId });

        if (connected) {
            connected.socketId = socketId;
            connected.isOnline = true;
            connected.lastSeen = new Date();
            await connected.save();
        } else {
            connected = await this.connectedUserModel.create({
                userId: userId,
                socketId,
                userName,
                isOnline: true,
                lastSeen: new Date(),
            });
        }

        return connected;
    }

    /**  Set user offline */
    async setOfflineUser(userId: Types.ObjectId) {
        const user = await this.connectedUserModel.findOne({ userId });
        if (user) {
            user.isOnline = false;
            user.lastSeen = new Date();
            await user.save();
        }
    }

    async getOnlineUsers() {
        return this.connectedUserModel.find({ isOnline: true });
    }
    // ======================================Conversations =============================================
    async getConversationById(conversationId: Types.ObjectId) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) throw new WsException('Conversation not found');

        const messages = await this.messageModel
            .find({ conversationId: conversationId })
            .sort({ createdAt: 1 })
            .populate('senderId', 'role')
            .populate('receiverId', 'role')
            .select('message isRead');
        return {
            messages,
        };
    }


}