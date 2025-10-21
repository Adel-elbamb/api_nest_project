// connected-user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OnlineUsersDocument = OnlineUsers & Document;

@Schema({ timestamps: true, collection: 'OnlineUsers' })
export class OnlineUsers {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    socketId: string;

    @Prop({ required: true })
    userName: string;

    @Prop({ default: true })
    isOnline: boolean;

    @Prop({ type: Date, default: Date.now })
    lastSeen?: Date;
}

export const OnlineUsersSchema = SchemaFactory.createForClass(OnlineUsers);
