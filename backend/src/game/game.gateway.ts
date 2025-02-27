import { Socket, Server } from 'socket.io';
import { randomUUID } from 'crypto';
import { ZodValidationPipe } from 'src/pipes/validation.pipe';
import { GameService } from 'src/game/game.service';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'prisma/prisma.service';
import { Game } from '@prisma/client';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import {
	gameBallDto,
	gamePaddleDto,
	gameId,
	gameSettingsDto,
	inviteGameDto
} from 'src/shared/game.interfaces';
import {
	gameIdSchema,
	gamePaddleDtoSchema,
	newGameDtoSchema,
	gameSettingsDtoSchema,
	inviteGameDtoSchema,
} from 'src/shared/schemas/game.schemas';
import { Inject, Logger, forwardRef } from '@nestjs/common';

@WebSocketGateway({ namespace: '/game' })
export class GameGateway
	implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private prisma: PrismaService,
		@Inject(forwardRef(() => GameService))
		private gameService: GameService,
		private user: UsersService,
	) { }

	private gameQueue: {
		id: string | undefined;
		playerId: string | undefined;
	} = { id: undefined, playerId: undefined };

	@WebSocketServer()
	server: Server;

	async handleConnection(client: Socket) {
		try {
			const userId = client.handshake.auth.id;
			if (!userId)
				return;
			const where = { id: userId };
			const data = { isPlaying: true };
			client.join(userId);
			await this.prisma.user.update({ where, data });
		} catch (error) {
			Logger.debug(error);
		}
	}

	async handleDisconnect(client: Socket) {
		try{
			const userId = client.handshake.auth.id;
			if (!userId)
				return;
			const where = { id: userId };
			const data = { isPlaying: false };
			await this.prisma.user.update({ where, data });
			if (this.gameQueue.playerId === userId)
				this.gameQueue = { id: undefined, playerId: undefined };
			else {
				const gameId = await this.gameService.findGameOfUser(userId);
				if (gameId) {
					await this.gameService.abortGame(userId, gameId);
					this.server.to(gameId).emit('abortGame');
				}
			}
		} catch(error) {
			Logger.debug(error);
		}
	}

	@SubscribeMessage('joinGame')
	async joinGame(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(gameSettingsDtoSchema)
		) payload: gameSettingsDto
	) {
		const userId = client.handshake.auth.id;
		if (!userId)
			return;
		if (this.gameQueue.id === undefined) {
			this.gameQueue = {
				id: randomUUID(),
				playerId: userId,
			};
			client.join(this.gameQueue.id!);
			return ;
		}
		else if (this.gameQueue.playerId !== userId) {
			await this.launchGame(this.gameQueue.id, client, this.gameQueue.playerId, payload);
			this.gameQueue = { id: undefined, playerId: undefined };
		}
	}

	@SubscribeMessage('inviteFriend')
	async inviteFriend(
			@ConnectedSocket() client: Socket,
			@MessageBody(
				new ZodValidationPipe(inviteGameDtoSchema)
		) payload: inviteGameDto) {
		const id: string = randomUUID();
		this.server.in(payload.opponentId).socketsJoin(id);
		await this.launchGame(id, client, payload.opponentId, payload.settings);
	}

	async launchGame(gameId: string, client: Socket, opponentId: string, settings: gameSettingsDto){
		try{
			client.join(gameId);
			const userId = client.handshake.auth.id;
			const newGame = await this.gameService.createGame( userId, opponentId, gameId, settings);
			this.server.to(gameId).emit('newGame', newGame)
			await this.gameService.createBall(newGame);
			await this.prisma.user.update({ where: { id: userId }, data: { score: 0 } })
			await this.prisma.user.update({ where: { id: opponentId }, data: { score: 0 } })
		} catch(error) {
			Logger.debug(error);
		}
	}

	@SubscribeMessage('movePaddle')
	async SomeoneMoved(
		@ConnectedSocket() client: Socket,
		@MessageBody(
			new ZodValidationPipe(gamePaddleDtoSchema)
		) payload: gamePaddleDto) {
		client.broadcast.to(payload.gameId).emit('movePaddle', payload);
		await this.gameService.movePaddle(client.handshake.auth.id, payload);
	}

	updateBall(game: Game) {
		const ball: gameBallDto = {
			gameId: game.gameId,
			ball: game,
		}
		this.server.to(game.gameId).emit('updateBall', ball);
	}

	async markPoint(game: Game, looserIndex: number) {
		const looserId = game.players[looserIndex];
		const winnerId = game.players[1 - looserIndex];
		this.server.to(looserId).emit('lostPoint');
		this.server.to(winnerId).emit('winPoint');
	}

	@SubscribeMessage('quitGame')
	async abortGame(
		@ConnectedSocket() client: Socket,
		@MessageBody(new ZodValidationPipe(gameIdSchema)) gameId: gameId) {
		const userId = client.handshake.auth.id;
		if (!userId)
			return;

		if (this.gameQueue.playerId === userId) {
			this.gameQueue = { id: undefined, playerId: undefined };
			return;
		}

		this.gameService.abortGame(userId, gameId);
		client.broadcast.to(gameId).emit('abortGame');

	}

	leaveRoom(id:string) {
		this.server.socketsLeave(id);
	}
}
