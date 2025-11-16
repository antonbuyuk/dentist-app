import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  path: '/ws',
  transports: ['websocket'],
})
export class ScheduleGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  afterInit() {}
  handleConnection() {}
  handleDisconnect() {}

  @SubscribeMessage('schedule:update')
  handleScheduleUpdate(@MessageBody() payload: unknown) {
    this.server.emit('schedule:updated', payload);
  }
}
