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
import { UsersService } from './users.service'
import { PrismaService } from 'prisma/prisma.service';
import { ZodValidationPipe } from 'src/pipes/validation.pipe';
import { chatInteractionDtoSchema } from 'src/shared/schemas/chat.schemas';
import { chatInteractionDto } from 'src/shared/chat.interfaces';

@WebSocketGateway({ namespace: 'userState' })
export class ConnectedGateway
{
	@WebSocketServer() server: Server;
	constructor(
		private prisma: PrismaService,
        private user: UsersService
	) {}

	async handleConnection(client: Socket) {
		const userId = client.handshake.auth.id;
		if (!userId)
			return;
		client.join(userId);
	}

	@SubscribeMessage('isConnected')
	async isConnected(client:Socket) {
		const userId = client.handshake.auth.id;
		this.user.isConnected(userId);
		this.server.emit('isConnected', userId);
	}

	@SubscribeMessage('isNoLongerConnected')
	async isNoLongerConnected(client:Socket) {
		const userId = client.handshake.auth.id;
		this.user.isDisconnected(userId);
		this.server.emit('isNoLongerConnected', userId);
	}

	@SubscribeMessage('invitationCanceled')
	async invitationCanceled(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: any
	){
		this.server.to(payload).emit('invitationCanceled');
	}

	@SubscribeMessage('invitationResponse')
	async acceptInvitation(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: any
	){
//		this.server.to(payload.userId).emit('invitationResponse', payload);
		this.server.to(payload.friendId).emit('invitationResponse', payload);
		return (true);
	}

	@SubscribeMessage('inviteToPlay')
	async inviteToPlay(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: any
	){
		await this.server.to(payload.friendId).emit('inviteToPlay', payload)
	}

	@SubscribeMessage('blockUser')
	async blockUser(
		@ConnectedSocket() client: Socket,
		@MessageBody(new ZodValidationPipe(chatInteractionDtoSchema)) payload: chatInteractionDto
	) {
		const list = await this.user.blockUser(client.handshake.auth.id, payload);
		return (list);
	}

	@SubscribeMessage('isTalking')
	async isTalkingReceived(client:Socket) {
		const userId = client.handshake.auth.id;
		if (!userId)
			return ;
		this.user.update(userId, {isTalking: true});
		this.server.emit('isTalking', userId);
	}

	@SubscribeMessage('updateName')
	async updateName(
		@ConnectedSocket() client: Socket,
		@MessageBody() newName: string
	) {
		const ok = await this.user.updateName(client.handshake.auth.id, newName);
		return (ok !== undefined);
	}

	@SubscribeMessage('quitTalking')
	async quitTalkingReceived(client:Socket) {
		const userId = client.handshake.auth.id;
		if (!userId)
			return ;
		this.user.update(userId, { isTalking: false });
		this.server.emit('quitTalking', userId);
	}

	@SubscribeMessage('isPlaying')
	async isPlayingReceived(client:Socket){
		const userId = client.handshake.auth.id;
		if (!userId)
			return ;
		this.user.update(userId, {isPlaying: true});
		this.server.emit('isPlaying', userId);
	}

	@SubscribeMessage('quitPlaying')
	async quitPlayingReceived(client:Socket){
		const userId = client.handshake.auth.id;
		if (!userId)
			return ;
		this.user.update(userId, {isPlaying: false});
		this.server.emit('quitPlaying', userId);
	}
}
