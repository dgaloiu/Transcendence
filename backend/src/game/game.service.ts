import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";
import { Game } from "@prisma/client";
import { UsersService } from "src/users/users.service";

import {
	gameDto,
	gamePaddleDto,
	Ball,
	endGameDto,
	gameSettingsDto,
} from 'src/shared/game.interfaces';

import { PrismaService } from "prisma/prisma.service";
import { GameGateway } from "./game.gateway";


@Injectable()
export class GameService {
	constructor (
		@Inject(forwardRef(() => GameGateway))
		private Users: UsersService,
		private gateway: GameGateway,
		private prisma: PrismaService,
	) { }

	async findGame(gameId: string): Promise< Game > {
		try {
			const where = { gameId };
			const game = await this.prisma.game.findUniqueOrThrow({ where });
			return (game);
		} catch (error) {
			Logger.debug(error,  "game.service findGame");
		}
	}

	async findGameOfUser(userId: string): Promise<string | undefined> {
		try {
			const where = { players: { has: userId } };
			const game = await this.prisma.game.findFirstOrThrow({ where });
			return (game.gameId);
		} catch (error) {
			Logger.debug(error,  "game.service findGameOfUser");
		}
	}

	async resetPaddles(game: Game) {
		try {
			const data = { paddlePos: 525 / 2 };
			await this.prisma.user.update({ where: {id: game.players[0]}, data });
			await this.prisma.user.update({ where: {id: game.players[1]}, data });
		} catch (error) {
			Logger.debug(error, "game.service resetPaddles");
		}
	}

	async createGame (
		clientId: string,
		opponentId: string,
		gameId: string,
		settings:gameSettingsDto
	): Promise< Game > {
		try {
			const data = {
				gameId,
				...settings,
				players: [clientId, opponentId],
			};
			const game = await this.prisma.game.create({ data });
			this.resetPaddles(game);
			return (game);
		} catch (error) {
			Logger.debug(error,  "game.service createGame");
		}
	}

	async createBall( game: Game) {
		try {
			const where = { gameId: game.gameId };
			const found = await this.prisma.game.findUnique({ where });
			if (!found)
				return ;
			const data = {
				x: 858 / 2,
				y: 10 + Math.random() * 505,
				dirY: 2 * (Math.random() - 0.5),
				speed: game.ballSpeed,
			};
			const updatedGame = await this.prisma.game.update({ where, data });
			this.gateway.updateBall(updatedGame);
			await this.nextIntersect(updatedGame);
		} catch (error) {
			Logger.debug(error,  "game.service createBall");
		}
	}

	async movePaddle(clientId: string, gamePaddle: gamePaddleDto) {
		try {
			const where = { id: clientId };
			await this.prisma.user.update({ where, data: { paddlePos: gamePaddle.myPaddlePos } });
		} catch (error) {
			Logger.debug(error,  "game.service movePaddle");
		}
	}

	async nextIntersect(game: Game) {
		try {
			const found = await this.prisma.game.findUnique({ where: { gameId: game.gameId } });
			if (!found)
				return;
			var steps: number = -5;
			while (game.x > game.distPaddle && game.x < 858 - game.distPaddle) {
				game.x += game.dirX * game.speed;
				game.y += game.dirY * game.speed;
				if (game.y - game.ballSize / 2 < 0 || game.y + game.ballSize / 2 > 525)
					game.dirY *= -1;
				steps++;
			}
			game.x -= game.dirX * (game.speed + 1);
			game.y -= game.dirY * (game.speed + 1);
			await this.prisma.game.update({ where: {gameId: game.gameId}, data: game });
			const time = 1000 * steps / 60;
			setTimeout(() => this.checkCollision(game), time);
		} catch (error) {
			Logger.debug(error,  "game.service nextIntersect");
		}
	}

	async checkCollision(game: Game) {
		try {
			const found = await this.prisma.game.findUnique({ where: { gameId: game.gameId } });
			if (!found)
				return;
			const paddleIndex = (game.dirX === 1) ? 0 : 1; // ATTENTION THIS COULD BE WRONG
			const id = game.players[paddleIndex];
			const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
			const dev = user.paddlePos - game.y;
			if (Math.abs(dev) < (game.paddleSize + game.ballSize) / 2) {
				game.dirX *= -1;
				game.dirY -= 3 * dev / game.paddleSize;
				if (Math.abs(game.dirY) > 2)
					game.dirY *= 2 / Math.abs(game.dirY);
				game.speed += game.speedIncrease;
				await this.prisma.game.update({ where: { gameId: game.gameId }, data: game });
				await this.gateway.updateBall(game);
				await this.nextIntersect(game);
			} else {
				setTimeout(() => this.markPoint(game, paddleIndex), 500);
			}
		} catch (error) {
			Logger.debug(error,  "game.service checkCollision");
		}
	}

	async markPoint(game: Game, looserIndex: number) {
		try {
			const found = await this.prisma.game.findUnique({ where: { gameId: game.gameId } });
			if (!found)
				return;
			const winnerIndex = 1 - looserIndex;
			const winner = game.players[winnerIndex];
			const where = { id: winner };
			const data = { score: { increment: 1 } };
			const updatedUser = await this.prisma.user.update({ where, data });
			await this.gateway.markPoint(game, looserIndex);
			if (updatedUser.score >= game.winScore) {
				await this.saveScores(game, winnerIndex);
				return ;
			} else {
				await this.createBall(game);
			}
		} catch (error) {
			Logger.debug(error,  "game.service markPoint");
		}
	}

	async saveScores(game: Game, winner: number) {
		try {
			const looser = 1 - winner;
			const winnerUserQuery = {
				where: { id: game.players[winner] },
				data: { gameWon: { increment: 1 } },
			}
			const winnerUser = await this.prisma.user.update(winnerUserQuery);

			const looserUserQuery = {
				where: { id: game.players[looser] },
				data: { gameLost: { increment: 1 } },
			}
			const looserUser = await this.prisma.user.update(looserUserQuery);

			const historyWinnerData = {
				user: { connect: { id: game.players[winner] } },
				won: true,
				looserScore: looserUser.score,
				winnerScore: winnerUser.score,
				opponent: { connect: { id: game.players[looser] } }
			};
			const history1 = await this.prisma.history.create({ data: historyWinnerData });

			const historyLooserData = {
				user: { connect: { id: game.players[looser] } },
				won: false,
				looserScore: looserUser.score,
				winnerScore: winnerUser.score,
				opponent: { connect: { id: game.players[winner] } }
			};
			const history2 = await this.prisma.history.create({ data: historyLooserData });
			const found = await this.prisma.game.findUnique({ where: { gameId: game.gameId } });
			this.gateway.leaveRoom(game.gameId);
			if (!found)
				return;
			await this.prisma.game.delete({ where: { gameId: game.gameId } });
		} catch (error) {
			Logger.debug(error,  "game.service saveScores");
		}
	}

	async abortGame(clientId: string, gameId: string) {
		try {
			const game = await this.findGame(gameId);
			if (game){
				const where = { id: clientId };
				const data = { score: -1 };
				await this.prisma.user.update({where, data});
				const winnerIndex = (game.players[0] === clientId)? 1: 0;
				await this.saveScores(game, winnerIndex);
				return ;
			}
		} catch (error) {
			Logger.debug(error,  "game.service abortGame");
		}
	}
}
