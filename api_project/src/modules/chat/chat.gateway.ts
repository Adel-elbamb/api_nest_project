// src/modules/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) { }

  // user joins his room (e.g. room = userId)
  @SubscribeMessage('joinRoom')
  handleJoin(@ConnectedSocket() socket: Socket, @MessageBody() userId: string) {
    console.log(`Socket ID: ${socket.id} is trying to join room: ${userId}`);
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  }

  // send message event
  @SubscribeMessage('sendMessage')
  async handleMessage(
  
    @MessageBody() data: { senderId: string; receiverId: string; content: string },
  ) {
    const savedMsg = await this.chatService.saveMessage(
      data.senderId,
      data.receiverId,
      data.content,
    );

    // send to receiver room
    this.server.to(data.receiverId).emit('newMessage', savedMsg);
    return savedMsg;
  }
}
