import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Exclude } from "class-transformer";
import { Document , Schema as mongoseSchema } from "mongoose";


export type UserDocument = User & Document;

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

@Schema({ timestamps: true })
    
export class User { 
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    @Exclude()
    password: string;

    @Prop({
        type: String,
        enum: UserRole,
        default: UserRole.USER
    })
    role: UserRole;
    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}

export const UsersSchema = SchemaFactory.createForClass(User);
