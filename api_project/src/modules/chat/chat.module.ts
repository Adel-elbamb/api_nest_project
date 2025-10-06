// src/modules/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../../Schemas/message.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])],
    providers: [ChatGateway, ChatService],
})
export class ChatModule { }
