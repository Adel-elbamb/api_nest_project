// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  OnGatewayConnection,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
  WebSocketServer
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Socket, Server } from "socket.io";

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private onlineUsers = new Map(); // username -> socket.id

  constructor(private jwtService: JwtService) { }

  handleConnection(client: Socket) {
    try {
      // Read the token from header instead of auth
      const token = client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) throw new Error('No token provided');

      const user = this.jwtService.verify(token);
      client.data.user = user;
      // console.log(user)
      this.onlineUsers.set(user.name, client.id);
      console.log(this.onlineUsers)
      // console.log(client.id)
      console.log(` ${user.name} connected`);
    } catch (err) {
      console.log("invalid token:", err.message);
      client.disconnect();
    }
  }

  @SubscribeMessage("privateMessage")
  handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; message: string }
  ) {
    const sender = client.data.user.username;
    const receiverSocketId = this.onlineUsers.get(data.to);
    console.log(receiverSocketId)
    if (receiverSocketId) {
      client.to(receiverSocketId).emit("privateMessage", {
        from: sender,
        message: data.message,
      });
    }
  }



}
