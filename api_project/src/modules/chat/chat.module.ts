import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { Message, MessageSchema } from 'src/Schemas/message.schema';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';


@Module({
    imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])],
    providers: [ChatGateway, ChatService],
    controllers: [ChatController],
})
export class ChatModule { }
