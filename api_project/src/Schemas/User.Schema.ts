// user.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { UserRole } from "./user_role.interface";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({
        type: String,
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;
}

export const UsersSchema = SchemaFactory.createForClass(User);
