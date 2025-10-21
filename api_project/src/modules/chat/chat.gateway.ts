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
import { Client } from 'node_modules/socket.io/dist/client';
import { SendMessageDto } from './Dtos/messageDto.dto';

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





  @SubscribeMessage('Send_Message')
  async handleSend_Message(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');
      // console.log(client.data.user)
    const senderId = sender.id;
    const senderType = sender.role;
    console.log(senderId)
    const { message, conversationId, userId } = data;

    // Save message & get conversation
    const conversation = await this.chatService.CreateMessage({
      senderId,
      senderType,
      message,
      conversationId,
      userId,
    });

    //  Safely get conversation ID string
    const targetRoom = conversation?._id?.toString();
    if (!targetRoom) throw new WsException('Conversation ID is missing');

    // Emit message only to that conversation room
    this.server.to(targetRoom).emit('newMessage', {
      conversationId: targetRoom,
      senderId,
      senderType,
      message,
      timestamp: new Date(),
    });

    console.log(
      ` Message sent by ${senderType}  ${sender.name} (${senderId}) in conversation ${targetRoom}`,
    );
  }
  
}






//   // Edit message
//   @SubscribeMessage('editMessage')
//   async handleEditMessage(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { messageId: string; newMessage: string },
//   ) {
//     const sender = client.data.user;
//     if (!sender) throw new WsException('Unauthorized sender');

//     const messageId = toObjectId(data.messageId);
//     const senderId = toObjectId(sender.id);

//     const updated = await this.chatService.editMessage(messageId, senderId, data.newMessage);
//     if (!updated) {
//       throw new WsException('Message not found or not authorized to edit');
//     }

//     const receiverSocketId = await this.chatService.getReceiverSocketId(updated.receiverId);

//     client.emit('messageUpdated', updated);
//     if (receiverSocketId) {
//       this.server.to(receiverSocketId).emit('messageUpdated', updated);
//     }

//     console.log(`✏️ Message edited by ${sender.name}`);
//   }

//   // Delete message
//   @SubscribeMessage('deleteMessage')
//   async handleDeleteMessage(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { messageId: string },
//   ) {
//     const sender = client.data.user;
//     if (!sender) throw new WsException('Unauthorized sender');

//     const messageId = toObjectId(data.messageId);
//     const senderId = toObjectId(sender.id);

//     const deleted = await this.chatService.deleteMessage(messageId, senderId);
//     if (!deleted) {
//       throw new WsException('Message not found or not authorized to delete');
//     }

//     const receiverSocketId = await this.chatService.getReceiverSocketId(deleted.receiverId);

//     client.emit('messageDeleted', { messageId: deleted._id });
//     if (receiverSocketId) {
//       this.server.to(receiverSocketId).emit('messageDeleted', { messageId: deleted._id });
//     }

//     console.log(`🗑️ Message deleted by ${sender.name}`);
//   }