// message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    senderId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    receiverId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
    conversationId: Types.ObjectId;

    @Prop({ required: true })
    message: string;

    @Prop({ default: false })
    isRead: boolean;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ receiverId: 1 });
