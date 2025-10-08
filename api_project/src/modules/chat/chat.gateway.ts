import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';
import { UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/filters/ws-exception.filter';
import { MessageDto } from './Dtos/messageDto.dto';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
@UseFilters(WsExceptionsFilter)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new WsException(errors),
  }),
)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>(); 

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) { }


  handleConnection(client: Socket) {
    try {
      const token = client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) throw new WsException('No token provided');

      const user = this.jwtService.verify(token);
      client.data.user = user;

      this.onlineUsers.set(user.id, client.id);
      console.log(this.onlineUsers)
      console.log(` ${user.name} connected`);
    } catch (err) {
      console.log(' invalid token:', err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        
        console.log(` User ${userId}  disconnected`);
        break;
      }
    }
  }

  
  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; message: string },
  ) {
    const sender = client.data.user;
    console.log(sender)
    if (!sender) throw new WsException('Unauthorized sender');

    const receiverSocketId = this.onlineUsers.get(data.to ?? '');
    if (!receiverSocketId)
      throw new WsException(`User ${data.to} is not online`);

   
    await this.chatService.saveMessage(sender.id, data.to!, data.message);

    client.to(receiverSocketId).emit('privateMessage', {
      from: sender.name,
      message: data.message,
    });

    console.log(` ${sender.name} → ${data.to}: ${data.message}`);
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; newMessage: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    const updated = await this.chatService.editMessage(
      data.messageId,
      sender.id,
      data.newMessage,
    );

    this.server.emit('messageUpdated', updated);
  }


  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    const deleted = await this.chatService.deleteMessage(data.messageId, sender.id);

    this.server.emit('messageDeleted', { messageId: deleted._id });
  }

  // @SubscribeMessage('broadcastMessage')
  // handleBroadcastMessage(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() data: MessageDto,
  // ) {
  //   const sender = client.data.user;
  //   console.log(sender)
  //   if (!sender) throw new WsException('Unauthorized sender');

  //   this.server.emit('broadcastMessage', {
  //     from: sender.name,
  //     message: data.message,
  //   });

  //   console.log(` Broadcast from ${sender.name}: ${data.message}`);
  // }

  // @SubscribeMessage('getOnlineUsers')
  // handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
  //   const users = Array.from(this.onlineUsers.keys());
  //   client.emit('onlineUsers', users);
  // }
}
