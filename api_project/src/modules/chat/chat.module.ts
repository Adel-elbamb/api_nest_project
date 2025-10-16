import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { Message, MessageSchema } from 'src/Schemas/message.schema';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation, ConversationSchema } from 'src/Schemas/Converstion.schema';
import { ConnectedUser  , ConnectedUserSchema } from 'src/Schemas/ConnectedUser.schema';


@Module({
    imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
        MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
        MongooseModule.forFeature([{ name: ConnectedUser.name, schema: ConnectedUserSchema }]),
    ],
    providers: [ChatGateway, ChatService],
    controllers: [ChatController],
})
export class ChatModule { }
