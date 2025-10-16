// connected-user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConnectedUserDocument = ConnectedUser & Document;

@Schema({ timestamps: true, collection: 'ConnectedUsers' })
export class ConnectedUser {
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

export const ConnectedUserSchema = SchemaFactory.createForClass(ConnectedUser);
