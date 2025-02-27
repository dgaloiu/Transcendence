import {
	Injectable,
	BadRequestException,
	Logger
} from '@nestjs/common';
import { AuthUser } from 'src/shared/auth.interfaces';
import { PrismaService } from 'prisma/prisma.service';
import { User, BlockedUser } from '@prisma/client';
import { chatInteractionDto } from 'src/shared/chat.interfaces';


@Injectable()
export class UsersService {
	constructor(
		private prisma: PrismaService
	) {
	}

	async create(createUserDto: AuthUser) {
		try {
			const data = {
				email: createUserDto.email,
				intraLogin: createUserDto.intraLogin,
				name: createUserDto.intraLogin
			}
			await this.prisma.user.create({ data: data });
		} catch (e) {
			Logger.warn(e, 'users.service -> create');
		}
	}

	async find(where: any) {
		try {
			return (await this.prisma.user.findUniqueOrThrow({ where }));
		} catch (e) {
			throw new BadRequestException('Unable to find user');
		}
	}

	async findOrCreateUser(user:any): Promise<User> {
		try {
			const where = {  intraLogin: user.intraLogin };
			const result = await this.prisma.user.findUnique({ where });
			if (result)
				return (result);
			const data = {
				email: user.email,
				intraLogin: user.intraLogin,
				name: user.name,
				isConnected: false,
			};
			const created = await this.prisma.user.create({ data });
			return created;
		} catch (e) {
			Logger.warn(e, 'users.service -> findOrCreateUser');
		}
	}


	async blockUser(blockerId: string, payload: chatInteractionDto): Promise<BlockedUser[]>{
		try {
			const where = { id: blockerId }
			if (payload && payload.to && payload.to.id)
				this.prisma.blockedUser.create({
					data: {
						blocker: { connect: { id: blockerId } },
						blockedUser: { connect: { id: payload.to.id } }
					},
				});
			const list = await this.prisma.blockedUser.findMany({ where: { blockerId } })
			return list;
		} catch(e) { }
	}

	async update(id: string, data: any) {
		try {
			const where = { id }
			const found = await this.prisma.user.findUnique({ where });
			if (found)
				await this.prisma.user.update({ where, data });
		} catch (e) {
			Logger.warn(e, 'users.service -> update');
		}
	}

	remove(id: string) {
		return `This action removes a #${id} user`;
	}

	async findOneIntraUser(login: string): Promise<User> {
		try {
			const where = { intraLogin: login };
			const result = await this.prisma.user.findFirst({ where });
			return (result);
		} catch (e) {
			Logger.warn(e, 'users.service -> findOneIntraUser');
		}
	}

	async updateName(id: string, name: string): Promise<User> {
		try {
			let updateUser = await this.prisma.user.update({
				where: { id },
				data: { name } });
			return updateUser;
		} catch(e){}
	}

	async disconnectUser(userId: string) {
		try {
			let updateUser = await this.prisma.user.update({
				where: {
					id: userId
				},
				data: {
					isConnected: false
				}
			})
		} catch (e) { }
	}
		

	async isConnected(userId: string) {
		try {
			if (!userId)
				return;
			const where = { id: userId };
			//const user = await this.prisma.user.findUniqueOrThrow({ where });
			const data = { isConnected: true };
			await this.prisma.user.update({ where, data });
		} catch (e) { }
	}


	async isDisconnected(userId: string) {
		try {
			if (!userId)
				return;
			const where = { id: userId };
			const data = { isConnected: false };
			await this.prisma.user.update({ where, data });
		} catch (e) { }
	}

	async leaderBoard(){
		try{
			const leaderBoard = await this.prisma.user.findMany({ orderBy:{ gameWon: 'desc' }});
			return (leaderBoard);
		} catch (e) {
			Logger.warn(e, 'users.service -> leaderBoard');
		}
	}

	async history(id:string){
		try{
			const where = { id };
			const select = {
				history: {
					include: {
						opponent: {
							select: {
								name: true,
							},
						},
					},
				},
			};
			const history = await this.prisma.user.findUnique({ where, select });
			return (history.history);
		} catch (e) {
			Logger.warn(e, 'users.service -> history');
		}
	}

}
