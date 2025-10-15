// conversation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true, collection: 'Conversations' })
export class Conversation {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    assignedTo: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
