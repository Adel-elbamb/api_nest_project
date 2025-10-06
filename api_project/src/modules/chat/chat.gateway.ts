// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  OnGatewayConnection,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Socket, Server } from "socket.io";
import { UsePipes, ValidationPipe, UseFilters } from "@nestjs/common";
import { WsExceptionsFilter } from "src/common/filters/ws-exception.filter";
import { MessageDto } from "./Dtos/messageDto.dto";

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
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private onlineUsers = new Map<string, string>(); 

  constructor(private jwtService: JwtService) { }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.headers['authorization']?.split(' ')[1];
      console.log(client.handshake.time)
      if (!token) throw new WsException('No token provided');

      const user = this.jwtService.verify(token);
      client.data.user = user;

      this.onlineUsers.set(user.name, client.id);
      console.log(this.onlineUsers);
      console.log(` ${user.name} connected`);
    } catch (err) {
      console.log(" invalid token:", err.message);
      client.disconnect();
    }
  }

  
  @SubscribeMessage("privateMessage")
  handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; message: MessageDto } 
  ) {
    const sender = client.data.user?.name;
    const receiverSocketId = this.onlineUsers.get(data.to);
    if (!receiverSocketId) throw new WsException(`User ${data.to} is not online`);

    client.to(receiverSocketId).emit("privateMessage", {
      from: sender,
      message: data.message,
    });
  }

  
  @SubscribeMessage("broadcastMessage")
  handleBroadcastMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageDto 
  ) {
    const sender = client.data.user?.name;
    if (!sender) throw new WsException('Unauthorized sender');

    this.server.emit("broadcastMessage", {
      from: sender,
      message: data.message,
    });
    console.log(` Broadcast from ${sender}: ${data.message}`);
  }
}
