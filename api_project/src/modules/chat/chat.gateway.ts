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
import { UsePipes, ValidationPipe, UseFilters, Inject } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/filters/ws-exception.filter';
import { MessageDto } from './Dtos/messageDto.dto';
import { ChatService } from './chat.service';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) throw new WsException('No token provided');

      const user = this.jwtService.verify(token);
      client.data.user = user;

      // Save user socket id in Redis
      await this.cacheManager.set(`onlineUser:${user.id}`, client.id, 0);

      // Debug: confirm stored socket id
      const socketId = await this.cacheManager.get(`onlineUser:${user.id}`);
      console.log(`🟢 ${user.name} connected with socket ${socketId}`);

      // Optionally keep a list of all online users
      const usersList =
        (await this.cacheManager.get<Record<string, string>>('onlineUsers')) || {};
      usersList[user.id] = client.id;
      await this.cacheManager.set('onlineUsers', usersList, 0);

      console.log('✅ Current online users:', usersList);
    } catch (err) {
      console.log('❌ Invalid token:', err.message);
      client.disconnect();
    }
  }

  // disconnect user and remove from redis
  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    await this.cacheManager.del(`onlineUser:${user.id}`);

    // Remove from the onlineUsers list
    const usersList =
      (await this.cacheManager.get<Record<string, string>>('onlineUsers')) || {};
    delete usersList[user.id];
    await this.cacheManager.set('onlineUsers', usersList, 0);

    console.log(`🔴 ${user.name} disconnected`);
    console.log('✅ Remaining online users:', usersList);
  }


  
  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; message: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    // Get receiver socket from Redis
    const receiverSocketId = await this.cacheManager.get<string>(`onlineUser:${data.to}`);
    if (!receiverSocketId) {
      throw new WsException(`User ${data.to} is not online`);
    }

    // Save message in DB
    await this.chatService.saveMessage(sender.id, data.to!, data.message);

    // Send the message to the receiver’s socket
    client.to(receiverSocketId).emit('privateMessage', {
      from: sender.name,
      message: data.message,
    });

    console.log(`💬 ${sender.name} → ${data.to}: ${data.message}`);
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

    // Find the receiver socket
    const receiverSocketId = await this.cacheManager.get<string>(
      `onlineUser:${updated.receiverId}`,
    );

    // Emit only to sender + receiver
    client.emit('messageUpdated', updated); // to sender
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messageUpdated', updated); // to receiver
    }

    console.log(`✏️ Message edited by ${sender.name}: ${updated.message}`);
  }


  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    const deleted = await this.chatService.deleteMessage(data.messageId, sender.id);

    // Find receiver socket
    const receiverSocketId = await this.cacheManager.get<string>(
      `onlineUser:${deleted.receiverId}`,
    );

    // Emit only to sender + receiver
    client.emit('messageDeleted', { messageId: deleted._id });
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messageDeleted', { messageId: deleted._id });
    }

    console.log(` Message deleted by ${sender.name}`);
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
