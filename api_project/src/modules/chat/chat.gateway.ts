import { OnModuleInit, } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
@WebSocketGateway()
export class ChatGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;
  onModuleInit() {
    // socket have all data for user connection 
    this.server.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
    })

  }

  @SubscribeMessage('sendMore')
  sendMore(@MessageBody() massage: string) {
    this.server.emit('newSend', massage);


  }

  @SubscribeMessage('sendOne')
  sendOne(@MessageBody() data: { userId: string, message: string }) {
    this.server.to(data.userId).emit('sendSingleUser', data.message);
  }

}
