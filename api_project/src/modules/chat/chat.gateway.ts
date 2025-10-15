// import {
//   WebSocketGateway,
//   SubscribeMessage,
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   WebSocketServer,
//   WsException,
// } from '@nestjs/websockets';
// import { JwtService } from '@nestjs/jwt';
// import { Socket, Server } from 'socket.io';
// import { UsePipes, ValidationPipe, UseFilters, Inject } from '@nestjs/common';
// import { WsExceptionsFilter } from 'src/common/filters/ws-exception.filter';
// // import { MessageDto } from './Dtos/messageDto.dto';
// import { ChatService } from './chat.service';
// import type { Cache } from 'cache-manager';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// @WebSocketGateway({ cors: true })
// @UseFilters(WsExceptionsFilter)
// @UsePipes(
//   new ValidationPipe({
//     whitelist: true,
//     forbidNonWhitelisted: true,
//     transform: true,
//     exceptionFactory: (errors) => new WsException(errors),
//   }),
//   )
  
// export class ChatGateway implements OnGatewayConnection {
//   @WebSocketServer()
//   server: Server;

//   constructor(
//     private jwtService: JwtService,
//     private chatService: ChatService,
//     @Inject(CACHE_MANAGER) private cacheManager: Cache,
//   ) { }

//   async handleConnection(client: Socket) {
//     try {
//       const token = client.handshake.headers.authorization?.split(' ')[1];
//       if (!token) throw new WsException('Unauthorized');

//       const decoded = this.jwtService.verify(token);
//       client.data.user = decoded;

//       await this.chatService.setOnlineUser(
//         decoded.id,
//         client.id,
//         decoded.name,
//       );

//       // console.log(` User connected: ${decoded.name} (${decoded.role})`);
//       // this.server.emit('userConnected', {
//       //   userId: decoded.id,
//       //   name: decoded.name,
//       //   role: decoded.role,
//       // });
//     } catch (err) {
//       console.log('❌ Connection refused:', err.message);
//       client.disconnect();
//     }
//   }


// //   async handleDisconnect(client: Socket) {
// //    console.log(client)
// //   const user = client.data.user;
// //     if (!user) return;
// //     await this.chatService.setOfflineUser(user.id);
// //     console.log(` User disconnected: ${user.name} (${user.role})`);
// //     this.server.emit('userDisconnected', { userId: user.id, name: user.name });
// // }
  
// //   @SubscribeMessage('privateMessage')
// //   async handlePrivateMessage(
// //     @ConnectedSocket() client: Socket,
// //     @MessageBody() data: { to: string; message: string },
// //   ) {
// //     const sender = client.data.user;
// //     if (!sender) throw new WsException('Unauthorized sender');

// //     // Get receiver socket from Redis
// //     const receiverSocketId = await this.chatService.getReceiverSocketId(data.to);
// //     console.log(receiverSocketId)
// //     if (!receiverSocketId) {
// //       throw new WsException(`User ${data.to} is not online`);
// //     }

// //     // Save message in DB
// //     await this.chatService.saveMessage(sender.id, data.to!, data.message);

// //     // Send the message to the receiver’s socket
// //     client.to(receiverSocketId).emit('privateMessage', {
// //       from: sender.name,
// //       message: data.message,
// //     });

// //     console.log(` ${sender.name} → ${data.to}: ${data.message}`);
// //   }




// }
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
import { UsePipes, ValidationPipe, UseFilters, Type } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/filters/ws-exception.filter';
import { ChatService } from './chat.service';
import { Types } from 'mongoose';

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

  // Keep a simple in-memory map for connected users
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

      await this.chatService.setOnlineUser(decoded.id, client.id, decoded.name);

      console.log(`✅ User connected: ${decoded.name}`);
      this.server.emit('userConnected', { userId: decoded.id, name: decoded.name });
    } catch (err) {
      console.log('❌ Connection refused:', err.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      await this.chatService.setOfflineUser(user.id);
      console.log(`❌ User disconnected: ${user.name}`);
      this.server.emit('userDisconnected', { userId: user.id, name: user.name });
    }
  }

  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; message: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    const receiverSocketId = await this.chatService.getReceiverSocketId(data.to);
    if (!receiverSocketId) throw new WsException(`User ${data.to} is not online`);

    await this.chatService.saveMessage(sender.id, data.to, data.message , sender.role);

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

    // Update message using service
    const updated = await this.chatService.editMessage(
      data.messageId,
      sender.id,
      data.newMessage,
    );

    if (!updated) {
      throw new WsException('Message not found or not authorized to edit');
    }

    // Get receiver’s socket
    const receiverSocketId = await this.chatService.getReceiverSocketId(
      updated.receiverId.toString(),
    );

    // Emit update to both sides
    client.emit('messageUpdated', updated);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messageUpdated', updated);
    }

    console.log(`✏️ Message edited by ${sender.name}`);
  }


  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const sender = client.data.user;
    if (!sender) throw new WsException('Unauthorized sender');

    // Delete message using service
    const deleted = await this.chatService.deleteMessage(data.messageId, sender.id);

    if (!deleted) {
      throw new WsException('Message not found or not authorized to delete');
    }

    const receiverSocketId = await this.chatService.getReceiverSocketId(
      deleted.receiverId.toString(),
    );

    // Notify both sender and receiver
    client.emit('messageDeleted', { messageId: deleted._id });
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messageDeleted', { messageId: deleted._id });
    }

    console.log(` Message deleted by ${sender.name}`);
  }


}


