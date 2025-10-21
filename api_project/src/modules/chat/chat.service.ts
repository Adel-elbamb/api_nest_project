import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WsException } from '@nestjs/websockets';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Message, MessageDocument } from "src/Schemas/message.schema";
import { Conversation, ConversationDocument } from 'src/Schemas/Converstion.schema';
import { OnlineUsers, OnlineUsersDocument } from 'src/Schemas/OnlineUsers.schema';
import { SendMessageDto } from './Dtos/messageDto.dto';
import { ConversationMemberDocument, ConversationMember } from 'src/Schemas/ConversationMembers.schema'
@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
        @InjectModel(OnlineUsers.name) private OnlineUsers: Model<OnlineUsersDocument>,
        @InjectModel(ConversationMember.name) private ConversationMemberModel: Model<ConversationMemberDocument>
    ) { }
    
    //=================================Online USER============================================

    /**  Set online user (store or update connection) */
    async setOnlineUser(userId: Types.ObjectId, socketId: string, userName: string) {
        let connected = await this.OnlineUsers.findOne({ userId: userId });

        if (connected) {
            connected.socketId = socketId;
            connected.isOnline = true;
            connected.lastSeen = new Date();
            await connected.save();
        } else {
            connected = await this.OnlineUsers.create({
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
        const user = await this.OnlineUsers.findOne({ userId });
        if (user) {
            user.isOnline = false;
            user.lastSeen = new Date();
            await user.save();
        }
    }

    async getOnlineUsers() {
        const onlineUsers = await this.OnlineUsers.find({ isOnline: true }).select('userId socketId lastSeen');

        return {
            count: onlineUsers.length,
            users: onlineUsers,
        };
    }

    // ======================================Conversations =============================================
    async CreateMessage({
        senderId,senderType,message,conversationId, userId,
    }: SendMessageDto & { senderId: Types.ObjectId; senderType: string }) {
        let conversation;

        // Case 1: Existing conversationId provided
        if (conversationId) {
            conversation = await this.conversationModel.findById(conversationId);
            if (conversation) {
                await this.messageModel.create({
                    senderId,
                    senderType,
                    conversationId: conversation._id,
                    message,
                });
                return conversation;
            }
        }

        // Case 2: Sender is USER
        if (senderType === 'user') {
            const existingMember = await this.ConversationMemberModel.findOne({ connectionId: senderId });

            if (existingMember) {
                await this.messageModel.create({
                    senderId,
                    senderType,
                    conversationId: existingMember.conversationId,
                    message,
                });
                return await this.conversationModel.findById(existingMember.conversationId);
            }

            // No existing conversation → create new
            conversation = await this.conversationModel.create({ assignedTo: userId });
            await this.ConversationMemberModel.create({
                conversationId: conversation._id,
                connectionId: senderId,
            });

            await this.messageModel.create({
                senderId,
                senderType,
                conversationId: conversation._id,
                message,
            });

            return conversation;
        }

        // Case 3: Sender is AGENT
        if (senderType === 'agent') {
            const existingMember = await this.ConversationMemberModel.findOne({ connectionId:userId });
            console.log(existingMember)
            if (existingMember) {
                await this.messageModel.create({
                    senderId,
                    senderType,
                    conversationId: existingMember.conversationId,
                    message,
                });
                return await this.conversationModel.findById(existingMember.conversationId);
            }

            // No existing conversation → create new
            conversation = await this.conversationModel.create({ assignedTo: userId });
            await this.ConversationMemberModel.create({
                conversationId: conversation._id,
                connectionId: userId,
            });

            await this.messageModel.create({
                senderId,
                senderType,
                conversationId: conversation._id,
                message,
            });

            return conversation;
        }

        // Default fallback
        throw new WsException('Invalid sender type or missing data');
    }

    async getConversationById(conversationId: Types.ObjectId) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) throw new WsException('Conversation not found');

        const messages = await this.messageModel
            .find({ conversationId: conversationId })
            .sort({ createdAt: 1 })
            .select('message isRead senderType');
        return {
            messages,
        };
    }

  
}