import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class User {
    @Prop({required:true})
    name: string;
    @Prop({required:true,unique:true })
    email: string;
    @Prop()
    password : string 
}

export const usersSchema = SchemaFactory.createForClass(User)