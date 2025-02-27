import {
	UseGuards,
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
import {
	WhoDto,
	MessageDto,
	roomSettingsDto,
	JoinDto,
	CreateRoomDto,
	RoomDto, RoomType,
	chatInteractionDto,
} from 'src/shared/chat.interfaces';

import {
	MessageDtoSchema,
	JoinDtoSchema,
	CreateRoomDtoSchema,
	chatInteractionDtoSchema,
	roomSettingsDtoSchema,
} from 'src/shared/schemas/chat.schemas';
import { WebSocketAccessTokenGuard } from 'src/auth/guards/websocket';
import { ZodValidationPipe } from 'src/pipes/validation.pipe';

import { Socket, Server } from 'socket.io';

import { PrismaService } from 'prisma/prisma.service';
import { ChatService } from 'src/chat/chat.service';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

	@WebSocketServer() server: Server;
	constructor(
		private prisma: PrismaService,
		private chat: ChatService,
		private user: UsersService
	) {}

	async handleConnection(client: Socket, ...args: any[]) {
		const userId = client.handshake.auth.id;
		if (!userId)
			return;

		const found = await this.prisma.user.findUnique({where: {id: userId}});
		if (!found)
			return ;
		const where = { id: userId };
		const data = { isTalking: true };
		await this.prisma.user.update({ where, data });
		this.server.emit('isTalking', userId);

		const rooms = await this.chat.getRooms(userId);
		rooms.forEach((room) => client.join(room.id));
		client.emit('getRooms', rooms);
		const relation = await this.chat.relationOfUser(userId);
		client.emit('getRelations', relation);
		client.join(userId);
	}

	async handleDisconnect(client:Socket) {
		try {
			const userId = client.handshake.auth.id;
			if (userId === null || userId === undefined)
				return;

			const where = { id: userId };
			const data = { isTalking: false };
			await this.prisma.user.update({ where, data });
			this.server.emit('quitTalking', userId);

		} catch(e) {}
	}

	@SubscribeMessage('makeAdmin')
	async makeAdmin(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(chatInteractionDtoSchema)
		) interaction: chatInteractionDto
	) {
		const userId = client.handshake.auth.id;
		const friendId = interaction.to.id;
		const roomId = interaction.room.id;
		if (await this.chat.setToAdministrator(interaction))
			this.server.to(roomId).emit('madeAdmin', interaction);
	}

	@SubscribeMessage('kick')
	async kick(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(chatInteractionDtoSchema)
		) interaction: chatInteractionDto,
	) {
		const userId = client.handshake.auth.id;
		const friendId = interaction.to.id;
		if(await this.chat.kick(interaction))
			this.server.to(friendId).emit('youAreKicked');
	}

	@SubscribeMessage('mute')
	async mute(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(chatInteractionDtoSchema)
		) interaction: chatInteractionDto
	) {
		const userId = client.handshake.auth.id;
		const friendId = interaction.to.id;
		const makeMute = await this.chat.muteUser(interaction, 5);
		if (makeMute)
			this.server.to(friendId).emit('youAreMuted');
	}

	@SubscribeMessage('ban')
	async ban(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(chatInteractionDtoSchema)
		) interaction: chatInteractionDto
	) {
		const userId = client.handshake.auth.id;
		const friendId = interaction.to.id;
		if(await this.chat.ban(interaction))
			this.server.to(friendId).emit('youAreBanned');
			this.server.in(friendId).socketsLeave(interaction.room.id);
	}

	@SubscribeMessage('roomSettings')
	async roomSettings(
		@ConnectedSocket() client: Socket,
		@MessageBody(new ZodValidationPipe(roomSettingsDtoSchema)) settings: roomSettingsDto
	) {
		const response = await this.chat.roomSettings(client.handshake.auth.id, settings);
		return response;
	}

	@SubscribeMessage('setPassword')
	async setPassword(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomId: string, password: string
	) {
		const response = await this.chat.setPassword(password, client.handshake.auth.id, roomId);
		return (response);
	}

	@SubscribeMessage('resetPassword')
	async resetPassword(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomId: string
	) {
		const response = await this.chat.resetPassword(client.handshake.auth.id, roomId);
		return (response);
	}

	@SubscribeMessage('usersNotInRoom')
	async usersNotInRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomId: string
	) {
		const response = await this.chat.usersNotInRoom(roomId);
		return (response);
	}

	@SubscribeMessage('invite')
	async invite(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(chatInteractionDtoSchema)
		) interaction: chatInteractionDto
	) {
		const invited = await this.chat.invite(client.handshake.auth.id, interaction)
		if (invited) {
			this.server.in(interaction.to.id).emit('invited', interaction.room.id);
			this.server.in(interaction.to.id).socketsJoin(interaction.room.id);
			const rooms = await this.chat.getRooms(interaction.to.id);
			this.server.to(interaction.to.id).emit('getRooms', rooms);
		}
	}

	@SubscribeMessage('addFriend')
	async addFriend(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(chatInteractionDtoSchema)
		) interaction: chatInteractionDto
	) {
		const userId = client.handshake.auth.id;
		const friendId:string = interaction.to.id;
		const newFriend = await this.chat.findOrCreateFriend(userId, friendId);
		return (newFriend);
	}

	@SubscribeMessage('privateMessage')
	async privateMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(chatInteractionDtoSchema)
		) interaction: chatInteractionDto,
	) {
		const userId = client.handshake.auth.id;
		const friendId = interaction.to.id;
		const userName = interaction.from.name;
		const friendName = interaction.to.name
		const relation = await this.chat.findOrCreateRelation(userId, friendId);
		const response = {
			roomId: relation.roomId,
			friendship: relation.friendship,
		}
		const toEmit = {...response, id: userId, name:userName};
		const toReponse = {...response, id: friendId, name: relation.name};
		this.server.to(friendId).emit('invited', toEmit);

		const relationOfFriend = await this.chat.relationOfUser(friendId);
		this.server.to(friendId).emit('getRelations', relationOfFriend);
		const relationOfUser = await this.chat.relationOfUser(userId);
		this.server.to(userId).emit('getRelations', relationOfUser);
		return (toReponse);
	}

	@SubscribeMessage('blockUser')
	async blockedUsers(
		@ConnectedSocket() client: Socket,
		@MessageBody() interaction: chatInteractionDto
	) {
		const userId = client.handshake.auth.id;
		const list = await this.chat.blockedUsers(userId, interaction);
		return list;
	}

	@SubscribeMessage('createRoom')
	async createRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(CreateRoomDtoSchema)
		) room: CreateRoomDto
	) {
		const userId = client.handshake.auth.id;
		const newRoom = await this.chat.createRoom(userId, room);
		client.join(newRoom.id);
		const rooms = await this.chat.getRooms(userId);
		client.emit('getRooms', rooms);
		rooms.forEach((r) => {
			if (r.type === 'PUBLIC' || r.type === 'PROTECTED')
				this.server.emit('getRooms', r);
		});
	}

	@SubscribeMessage('join')
	async joinRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(JoinDtoSchema)
		) join:JoinDto
	) {
		const userId = client.handshake.auth.id;
		const roomId:string = join.where.id;
		try {
			const canJoin:boolean = await this.chat.joinRoom(join);
			if (!canJoin)
				return ({ ok: false, users:[], messages:[] });
			const messages:MessageDto[] = await this.chat.listOfMessages(roomId);
			client.join(roomId);
			const userData = await this.chat.getUser(userId);
			const users = await this.chat.usersInRoom(userId, roomId);
			users.forEach(async (user) => {
				const relationOfUser = await this.chat.userInRoomRelative(userId, user.id, roomId);
				this.server.to(user.id).emit('updateRights', { roomId, user: relationOfUser });
			})
			return ({ ok: true, users, messages });
		} catch(e) {
			return ({ ok: false, users:[], messages:[] });
		};
	}

	@SubscribeMessage('message')
	async handleMessage(
		@ConnectedSocket()client: Socket,
		@MessageBody(
			new ZodValidationPipe(MessageDtoSchema)
		) message: MessageDto
	) {
		try {
			const messages:MessageDto[] = await this.chat.addMessage(message);
			const roomId = message.to.id;
			this.server.to(roomId).emit('new_incomming_message', { roomId,  messages });
		} catch (e) {
			Logger.debug(e, 'error in handleMessage');
		}
	}

	@SubscribeMessage('leaveRoom')
	async leaveRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomId: string
	) {
		const userId = client.handshake.auth.id;
		const response = await this.chat.leaveRoom(userId, roomId);
  client.leave(roomId);
		return (response);
	}
}
