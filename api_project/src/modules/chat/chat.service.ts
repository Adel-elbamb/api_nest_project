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
        return this.OnlineUsers.find({ isOnline: true });
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

    //=======================================MASSAGE ====================================
    // /**  Save message and create conversation if needed */
    // async saveMessage(senderId: Types.ObjectId, receiverId: Types.ObjectId, message: string, role: string): Promise<MessageDto> {
    //     let conversation;

    //     if (role === 'user') {
    //         conversation = await this.conversationModel.findOne({
    //             $or: [
    //                 { userId: senderId, assignedTo: receiverId },
    //                 { userId: receiverId, assignedTo: senderId },
    //             ],
    //         });
    //         let myConversion = await this.conversationModel.findOne({
    //             userId: senderId,
    //         });

    //         if (!conversation && !myConversion) {
    //             conversation = await this.conversationModel.create({
    //                 userId: senderId,
    //                 assignedTo: receiverId,
    //             });
    //         }
    //     }
    //     else if (role === 'agent') {
    //         conversation = await this.conversationModel.findOne({
    //             $or: [
    //                 { userId: senderId, assignedTo: receiverId },
    //                 { userId: receiverId, assignedTo: senderId },
    //             ],
    //         });

    //         if (!conversation) {
    //             conversation = await this.conversationModel.create({
    //                 userId: receiverId,
    //                 assignedTo: senderId,
    //             });
    //         }
    //     }

    //     const newMessage = await this.messageModel.create({
    //         senderId,
    //         receiverId,
    //         conversationId: conversation._id,
    //         message,
    //     });

    //     return newMessage;
    // }



    // /**  Edit message content */
    // async editMessage(messageId: Types.ObjectId, senderId: Types.ObjectId, newMessage: string) {
    //     const message = await this.messageModel.findOne({
    //         _id: messageId,
    //         senderId,
    //         isDeleted: false,
    //     });
    //     // console.log(message)

    //     if (!message) return null;

    //     message.message = newMessage;
    //     await message.save();

    //     return message.populate(['senderId', 'receiverId']);
    // }

    // /**  Soft delete message */
    // async deleteMessage(messageId: Types.ObjectId, senderId: Types.ObjectId) {
    //     const message = await this.messageModel.findOne({
    //         _id: messageId,
    //         senderId,
    //         isDeleted: false,
    //     });

    //     if (!message) return null;

    //     message.isDeleted = true;
    //     await message.save();

    //     return message.populate(['senderId', 'receiverId']);
    // }


    // /**  Get receiver's socket ID */
    // async getReceiverSocketId(userId: Types.ObjectId): Promise<string | null> {
    //     const connected = await this.OnlineUsers.findOne({ userId: userId });
    //     return connected ? connected.socketId : null;
    // }







    // async CreateMessage({ senderId, senderType, message, conversationId, userId }: SendMessageDto & { senderId: Types.ObjectId, senderType: string }) {
         
    //     // console.log(senderId, message, conversationId, userId);
    //     if (conversationId) {
    //         const conversation = await this.conversationModel.findOne({ _id: conversationId })
    //         if (conversation) {
    //             await this.messageModel.create({
    //                 senderId,
    //                 senderType,
    //                 conversationId: conversation._id,
    //                 message,
    //             })
    //         }

    //     }
    //     if (senderType == 'user') {
    //         const UserConverstion = await this.ConversationMemberModel.findOne({ userId: senderId })
    //         if (UserConverstion) {
    //             await this.messageModel.create({
    //                 senderId,
    //                 senderType,
    //                 conversationId: UserConverstion.conversationId,
    //                 message,
    //             })
    //         } else {
    //             const converstion = await this.conversationModel.create({ assignedTo: userId })

    //             const member = new this.ConversationMemberModel({
    //                 conversationId: converstion._id,
    //                 connectionId: senderId
    //             });
    //             await member.save();
    //             const SaveMessage = new this.messageModel({
    //                 senderId,
    //                 senderType,
    //                 conversationId: converstion._id,
    //                 message,
    //             })
    //             await SaveMessage.save()
    //         }
            
    //     }
    //     if (senderType == 'agent') {
    //         const UserConverstion = await this.ConversationMemberModel.findOne({ userId: userId })
    //         if (UserConverstion) {
    //             const SaveMessage = new this.messageModel({
    //                 senderId,
    //                 senderType,
    //                 conversationId: UserConverstion.conversationId,
    //                 message,
    //             })
    //             await SaveMessage.save()
          
    //         } else {
    //             const converstion = await this.conversationModel.create({ assignedTo: userId })

    //             const member = new this.ConversationMemberModel({
    //                 conversationId: converstion._id,
    //                 connectionId: userId
    //             });
    //             await member.save();
    //             const SaveMessage = new this.messageModel({
    //                 senderId,
    //                 senderType,
    //                 conversationId: converstion._id,
    //                 message,
    //             })
    //             await SaveMessage.save()
    //         }
    //     }
       
    // }

    
//     async CreateMessage({senderId,senderType,message,conversationId, userId,
//     }: SendMessageDto & { senderId: Types.ObjectId; senderType: string }) {
//         let conversation: ConversationDocument | null = null;

//         if (senderType === 'user') {
//             //  Check if user already has a conversation
//             const existingMember = await this.ConversationMemberModel.findOne({
//                 connectionId: senderId,
//             });

//             if (existingMember) {
//                 conversation = await this.conversationModel.findById(existingMember.conversationId);
//                 if (!conversation) throw new WsException('Conversation not found');
//             } else {
//                 //  No conversation → create a new one
//                 conversation = await this.conversationModel.create({
//                     assignedTo: null, // No agent yet
//                 });

//                 await this.ConversationMemberModel.create({
//                     conversationId: conversation._id,
//                     connectionId: senderId,
//                 });
//             }

//             //  Save the message
//             await this.messageModel.create({
//                 senderId,
//                 senderType,
//                 conversationId: conversation._id,
//                 message,
//             });

//             return conversation;
//         }

//         if (senderType === 'agent') {
//             //  Case 1: Agent provides conversationId directly
//             if (conversationId) {
//                 conversation = await this.conversationModel.findById(conversationId);
//                 if (!conversation) throw new WsException('Conversation not found');
//             }
//             else if (userId) {
//                 const member = await this.ConversationMemberModel.findOne({
//                     connectionId: userId,
//                 });

//                 if (member) {
//                     conversation = await this.conversationModel.findById(member.conversationId);
//                     if (!conversation) throw new WsException('Conversation not found');
//                 } else {
                  
//                     conversation = await this.conversationModel.create({
//                         assignedTo: senderId,
//                     });

//                     await this.ConversationMemberModel.create({
//                         conversationId: conversation._id,
//                         connectionId: userId,
//                     });
//                 }
//             } else {
//                 throw new WsException('Agent must provide conversationId or userId');
//             }

//             //  Save the message
//             await this.messageModel.create({
//                 senderId,
//                 senderType,
//                 conversationId: conversation._id,
//                 message,
//             });

//             return conversation;
//         }


//         throw new WsException('Invalid senderType');
//     }

    
    
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

    
    
    
    

    
    
    


    
}