import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {Types} from "mongoose";
import { Document } from "mongoose";

export type PostDocument = Post & Document;

@Schema({ timestamps: true , collection: 'posts' })
    export class Post {
    @Prop({ required: true })
    title: string
    @Prop({ required: true })
    body: string
    @Prop()
    image?: string
    @Prop({ type:Types.ObjectId, ref:'User' , required:true })
    createdBy: Types.ObjectId 
}

export const PostSchema = SchemaFactory.createForClass(Post)