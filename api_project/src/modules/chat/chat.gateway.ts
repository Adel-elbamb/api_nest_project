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
import { ChatService } from './chat.service';
import { toObjectId } from 'src/common/Validations/objectId.helper';

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

  private onlineUsers = new Map<string, { socketId: string; name: string }>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) { }

  // Handle user connection
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];
      if (!token) throw new WsException('Unauthorized');

      const decoded = this.jwtService.verify(token);
      client.data.user = decoded;

      // Convert string to ObjectId safely
      const userId = toObjectId(decoded.id);
      await this.chatService.setOnlineUser(userId, client.id, decoded.name);

      console.log(`✅ User connected: ${decoded.name}`);
      this.server.emit('userConnected', { userId: decoded.id, name: decoded.name });
    } catch (err) {
      console.log('❌ Connection refused:', err.message);
      client.disconnect();
    }
  }

  // Handle user disconnect
  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      const userId = toObjectId(user.id);
      await this.chatService.setOfflineUser(userId);
      console.log(`❌ User disconnected: ${user.name}`);
      this.server.emit('userDisconnected', { userId: user.id, name: user.name });
    }
  }

  // Send private message
  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; message: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    const senderId = toObjectId(sender.id);
    const receiverId = toObjectId(data.to);

    const receiverSocketId = await this.chatService.getReceiverSocketId(receiverId);
    if (!receiverSocketId) throw new WsException(`User ${data.to} is not online`);

    await this.chatService.saveMessage(senderId, receiverId, data.message, sender.role);

    client.to(receiverSocketId).emit('privateMessage', {
      from: sender.name,
      message: data.message,
    });

    console.log(`💬 ${sender.name} → ${data.to}: ${data.message}`);
  }

  // Edit message
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; newMessage: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    const messageId = toObjectId(data.messageId);
    const senderId = toObjectId(sender.id);

    const updated = await this.chatService.editMessage(messageId, senderId, data.newMessage);
    if (!updated) {
      throw new WsException('Message not found or not authorized to edit');
    }

    const receiverSocketId = await this.chatService.getReceiverSocketId(updated.receiverId);

    client.emit('messageUpdated', updated);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messageUpdated', updated);
    }

    console.log(`✏️ Message edited by ${sender.name}`);
  }

  // Delete message
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    const messageId = toObjectId(data.messageId);
    const senderId = toObjectId(sender.id);

    const deleted = await this.chatService.deleteMessage(messageId, senderId);
    if (!deleted) {
      throw new WsException('Message not found or not authorized to delete');
    }

    const receiverSocketId = await this.chatService.getReceiverSocketId(deleted.receiverId);

    client.emit('messageDeleted', { messageId: deleted._id });
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messageDeleted', { messageId: deleted._id });
    }

    console.log(`🗑️ Message deleted by ${sender.name}`);
  }
}
