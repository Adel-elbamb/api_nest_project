// conversation-member.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationMemberDocument = ConversationMember & Document;

@Schema({ timestamps: true, collection: 'conversation_members' })
export class ConversationMember {
    @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
    conversationId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    connectionId: Types.ObjectId;

    // @Prop({ enum: ['agent', 'user'], required: true })
    // role: string; // role inside conversation (not global user role)
}

export const ConversationMemberSchema = SchemaFactory.createForClass(ConversationMember);
