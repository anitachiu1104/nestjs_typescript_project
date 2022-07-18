import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Server } from 'ws';
import { PositionVo } from '../smart-meeting/booking/vo/position.vo';
import { MyBookingVo } from '../smart-meeting/booking/vo/mybooking.vo';
@WebSocketGateway({cors: true})
export class PadGateway implements OnGatewayInit {
  
  @WebSocketServer() wss: Server;
  wsClients=[];

  private logger: Logger = new Logger('chatGetWay')
  
  afterInit(server: any) {
    this.logger.log('wismGaetway')
  }

  handleConnection(client: any) {
    this.wsClients.push(client);
  }

  handleDisconnect(client) {
    for (let i = 0; i < this.wsClients.length; i++) {
      console.log("断开连接");
      if (this.wsClients[i] === client) {
        this.wsClients.splice(i, 1);
        break;
      }
    }
  }

  @SubscribeMessage('verify')
  handleVerify(client: Socket, message: {}) {
    console.log('verify',message);
    for (const client1 of this.wsClients) {
      client1.send(message.toString());
    }
  }

  @SubscribeMessage('booking')
  handleBooking(client: Socket, message: any) {
    console.log('booking',message);
    let resultData = JSON.stringify(message);
    for (const client1 of this.wsClients) {
      client1.send(resultData);
    }
  }
}
