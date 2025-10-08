import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    senderId: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    receiverId: string;

    @Prop({ required: true })
    message: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
