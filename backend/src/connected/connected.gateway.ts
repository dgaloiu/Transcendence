import {
	UsePipes,
	Logger,
} from '@nestjs/common';

import {
	MessageBody,
	SubscribeMessage,
	WebSocketServer,
	WebSocketGateway,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
	ConnectedSocket,
} from '@nestjs/websockets';

import { Socket, Server } from 'socket.io';

import { PrismaService } from 'prisma/prisma.service';

@WebSocketGateway({ namespace: 'connected' })
export class ConnectedGateway implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer() server: Server;
	constructor(
		private prisma: PrismaService,
	) {}

	async handleConnection(client: Socket, ...args: any[])
	{
		const userId = client.handshake.auth.id;
		if (!userId)
			return;
		const where = { id: userId };
		const data = { isConnected: true };
		await this.prisma.user.update({ where, data });
		this.server.emit('isConnected', userId);
	}

	async handleDisconnect(client:Socket)
	{
		const userId = client.handshake.auth.id;
		if (!userId)
			return;
		const where = { id: userId };
		const data = { isConnected: false };
		await this.prisma.user.update({ where, data });
		this.server.emit('isNoLongerConnected', userId);
	}
}
