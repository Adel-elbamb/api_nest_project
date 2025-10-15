import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WsException } from '@nestjs/websockets';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Message, MessageDocument } from "src/Schemas/message.schema";
import { Conversation, ConversationDocument } from 'src/Schemas/Converstion.schema';
import { ConnectedUser, ConnectedUserDocument } from 'src/Schemas/ConnectedUser.schema';
import { CreateMessageDto } from './Dtos/messageDto.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
        @InjectModel(ConnectedUser.name) private connectedUserModel: Model<ConnectedUserDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    /**  Save message and create conversation if needed */
    async saveMessage(
        senderId: Types.ObjectId,
        receiverId: string,
        message: string,
        role: string
    ): Promise<CreateMessageDto> {
        let conversation;

        // لو المرسل "user" → يقدر يكون عنده محادثة واحدة فقط
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

    // /**  Get all messages in a conversation */
    // async getConversation(userId: string, assignedTo: string) {
    //     const conversation = await this.conversationModel.findOne({
    //         $or: [
    //             { userId, assignedTo },
    //             { userId: assignedTo, assignedTo: userId },
    //         ],
    //     });

    //     if (!conversation) throw new WsException('Conversation not found');

    //     return this.messageModel
    //         .find({ conversationId: conversation._id })
    //         .sort({ createdAt: 1 })
    //         .populate('senderId', 'name role')
    //         .populate('receiverId', 'name role');
    // }

    /**  Set online user (store or update connection) */
    async setOnlineUser(userId: string, socketId: string, userName: string) {
        const objectId = new Types.ObjectId(userId);

        let connected = await this.connectedUserModel.findOne({ userId: objectId });

        if (connected) {
            connected.socketId = socketId;
            connected.isOnline = true;
            connected.lastSeen = new Date();
            await connected.save();
        } else {
            connected = await this.connectedUserModel.create({
                userId: objectId,
                socketId,
                userName,
                isOnline: true,
                lastSeen: new Date(),
            });
        }

        return connected;
    }

    /**  Set user offline */
    async setOfflineUser(userId: string) {
        const objectId = new Types.ObjectId(userId);
        const user = await this.connectedUserModel.findOne({ userId: objectId });
        if (user) {
            user.isOnline = false;
            user.lastSeen = new Date();
            await user.save();
        }
    }

    /**  Get receiver’s socket ID */
    async getReceiverSocketId(userId: string): Promise<string | null> {
        const connected = await this.connectedUserModel.findOne({ userId: new Types.ObjectId(userId) });
        return connected ? connected.socketId : null;
    }

    
    async getOnlineUsers() {
        return this.connectedUserModel.find({ isOnline: true });
    }



    async getConversationById(conversationId: string) {
        // Validate and convert to ObjectId
        const objectId = new Types.ObjectId(conversationId);

        // Check if conversation exists
        const conversation = await this.conversationModel.findById(objectId);
        if (!conversation) throw new WsException('Conversation not found');

        // Find all messages in this conversation
        const messages = await this.messageModel
            .find({ conversationId: objectId })
            .sort({ createdAt: 1 })
            .populate('senderId', 'role')
            .populate('receiverId', 'role')
            .select('message isRead');
        return {
            messages,
        };
    }


    /**  Edit message content */
    async editMessage(messageId: string, senderId: string, newMessage: string) {
        const objectId = new Types.ObjectId(messageId);
        const message = await this.messageModel.findOne({
            _id: objectId,
            senderId ,
            isDeleted: false,
        });
        console.log(message)

        if (!message) return null;

        message.message = newMessage;
        await message.save();

        return message.populate(['senderId', 'receiverId']);
    }


    /**  Soft delete message */
    async deleteMessage(messageId: string, senderId: string) {
        // const objectId = new Types.ObjectId(messageId);
        const message = await this.messageModel.findOne({
            _id: messageId ,
            senderId,
            isDeleted: false,
        });
        console.log(message)
        if (!message) return null;

        message.isDeleted = true;
        await message.save();

        return message.populate(['senderId', 'receiverId']);
    }














    // async getMessagesBetween(senderId: string, receiverId: string) {
    //     return this.messageModel.find({
    //         $or: [
    //             { senderId, receiverId },
    //             { senderId: receiverId, receiverId: senderId },
    //         ],
    //     })
    //         .sort({ createdAt: 1 }); 
    // }

    // async editMessage(messageId: string, userId: string, newMessage: string) {
    //     const message = await this.messageModel.findById(messageId);
    //     if (!message) throw new WsException('Message not found');

    //     if (message.senderId.toString() !== userId)
    //         throw new WsException('You can only edit your own messages');

    //     message.message = newMessage;
      

    //     await message.save();
    //     console.log('Message edited:', message);
    //     return message;
    // }

    // async deleteMessage(messageId: string, userId: string) {
    //     const message = await this.messageModel.findById(messageId);
    //     if (!message) throw new WsException('Message not found');

    //     if (message.senderId.toString() !== userId)
    //         throw new WsException('You can only delete your own messages');

    //     await message.deleteOne();
    //     console.log("Message deleted:", message);
    //     return message;
    // }






    // async setOnlineUser(userId: string, socketId: string, userName: string) {
    //     const objectId = new Types.ObjectId(userId);

    //     let connected = await this.connectedUserModel.findOne({ userId: objectId });

    //     if (connected) {
    //         connected.socketId = socketId;
    //         connected.isOnline = true;
    //         connected.lastSeen = new Date().toISOString();
    //         await connected.save();
    //     } else {
    //         connected = await this.connectedUserModel.create({
    //             userId: objectId,
    //             socketId,
    //             userName,
    //             isOnline: true,
    //             lastSeen: new Date().toISOString(),
    //         });
    //     }


    // }



}
