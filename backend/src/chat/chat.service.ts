import { PrismaService } from 'prisma/prisma.service';
import { RoomType } from '@prisma/client';
import {
	Injectable,
	BadRequestException,
	Logger,
} from '@nestjs/common';
import {
	CreateRoomDto,
	MessageDto,
	JoinDto,
	chatInteractionDto,
	roomSettingsDto,
	RoomDto,
	PasswordDto,
} from 'src/shared/chat.interfaces';
import { InterceptorsContextCreator } from '@nestjs/core/interceptors';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChatService {
	constructor(
		private prisma: PrismaService,
	) { }

	private is(userId: string) {
		const OwnerOf = async (roomId: string): Promise<boolean> => {
			const where = { id: roomId, ownerId: userId };
			return (await this.prisma.room.findUnique({ where }) ? true : false);
		};

		const UserOf = async (roomId: string): Promise<boolean> => {
			const where = { userId_roomId: { userId, roomId } };
			return (await this.prisma.roomUser.findUnique({ where }) ? true : false);
		};

		const AdminOf = async (roomId: string): Promise<boolean> => {
			const where = { userId_roomId: { userId, roomId } };
			return (await this.prisma.roomAdmin.findUnique({ where }) ? true : false)
		}

		const Muted = async (roomId: string): Promise<boolean> => {
			const where = { userId_roomId: { userId, roomId } };
			const muted = await this.prisma.roomMuted.findUnique({ where });
			return (muted ? (muted.mutedUntil > new Date()) : false);
		};

		const BannedFrom = async (roomId: string): Promise<boolean> => {
			const where = { userId_roomId: { userId, roomId } };
			return (await this.prisma.roomBanned.findUnique({ where }) ? true : false);
		};

		const FriendOfUser = async (friendId: string): Promise<boolean> => {
			const where = { userId_friendId: { userId, friendId } };
			return (await this.prisma.userUser.findUnique({ where }) ? true : false);
		};

		return ({
			OwnerOf,
			UserOf,
			AdminOf,
			Muted,
			BannedFrom,
			FriendOfUser,
		});
	}

	private transformToMessageDto(message: any): MessageDto {
		return ({
			id: message.id,
			from: {
				id: message.senderId,
				name: message.senderName
			},
			to: {
				id: message.roomId,
				name: message.roomName
			},
			message: message.message
		});
	}

	private transformToFriendDto(friend:any):any {
		return ({
			id: friend.id,
			name: friend.name,
		});
	}

	async hasEqualRights(payload:chatInteractionDto): Promise<boolean> {
		const roomId = payload.room.id;
		const toIsOwner = await this.is(payload.to.id).OwnerOf(roomId);
		const fromIsOwner = await this.is(payload.from.id).OwnerOf(roomId);
		if (toIsOwner || fromIsOwner)
			return false;
		const toIsAdmin = await this.is(payload.to.id).AdminOf(roomId);
		const fromIsAdmin = await this.is(payload.from.id).AdminOf(roomId);
		return (toIsAdmin === fromIsAdmin)
	}

	async getUser(userId: string) {
		try {
			const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
			return user;
		} catch (e) { }

	}

	async hasSupperiorRights(fromId: string, toId: string, roomId: string): Promise<boolean> {
		const fromIsOwner = await this.is(fromId).OwnerOf(roomId);
		if (fromIsOwner)
			return (true);
		const toIsOwner = await this.is(toId).OwnerOf(roomId);
		if (toIsOwner)
			return (false);
		const toIsAdmin = await this.is(toId).AdminOf(roomId);
		const fromIsAdmin = await this.is(fromId).AdminOf(roomId);
		return (fromIsAdmin && !toIsAdmin)
	}

	async addMessage(message:MessageDto): Promise<MessageDto[]> {
		const userId = message.from.id;
		const roomId = message.to.id;
		try {
			const isUser = this.is(userId);
			const isNotUser = !await isUser.UserOf(roomId);
			const isMuted = await isUser.Muted(roomId);
			const isBanned = await isUser.BannedFrom(roomId);
			if (isNotUser || isMuted || isBanned)
				return [];
			const data = {
				room: { connect: { id: message.to.id } },
				roomName: message.to.name,
				sender: { connect: { id: userId } },
				senderName: message.from.name,
				message: message.message
			};
			const messageCreated: any = await this.prisma.message.create({ data });
			const messageOutput: MessageDto = this.transformToMessageDto(messageCreated);
			return ([messageOutput]);
		} catch (e) {
			return ([]);
		}
	}

	async createRoom(userId:string, room: CreateRoomDto) {
		try {
			var hash: string = "";
			if (room.password) {
				const saltOrRounds = 10;
				hash = await bcrypt.hash(room.password, saltOrRounds);
			}
			const data = {
				name: room.name,
				type: room.type,
				password: hash,
				owner: { connect: { id: userId } },
				admins: { create: { user: { connect: { id: userId } } } },
				users: { create: { user: { connect: { id: userId } } } }
			};
			const newRoom = await this.prisma.room.create({ data });
			return (newRoom);
		} catch (e) {
			Logger.debug(e, 'error creating room');
		}
	}

	async muteUser(payload: chatInteractionDto, mutedFor: number): Promise<boolean> {
		const userId: string = payload.from.id;
		const roomId: string = payload.room.id
		const hasSupperiorRights = await this.hasSupperiorRights(userId, payload.to.id, roomId);
		if (!hasSupperiorRights) {
			Logger.debug("can't mute user with same right");
			return (false);
		}
		try {
			var date = new Date();
			date.setMinutes(date.getMinutes() + mutedFor);
			const where = { userId_roomId: { userId, roomId } };
			const data = { mutedUntil: date };
			const oldMute = await this.prisma.roomMuted.findUnique({ where });
			if (oldMute)
				await this.prisma.roomMuted.update({ where, data });
			else {
				const t = await this.prisma.roomMuted.create({
					data: {
						user: { connect: { id: payload.to.id } },
						room: { connect: { id: roomId } },
						mutedUntil: date
					}
				});
			}
			return (true);
		} catch (e) {
			Logger.debug(e, 'error muting user');
			return (false);
		}
	}

	async resetPassword(userId: string, roomId: string) {
		try {
			const isNotOwner = !await this.is(userId).OwnerOf(roomId);
			if (isNotOwner)
				return false;
			const where = { id: roomId };
			const data = { type: RoomType.PUBLIC };
			this.prisma.room.update({ where, data });
			return true;
		} catch (e) {
			Logger.debug(e, "resetPassword")
		}
	}

	async setPassword(password: string, userId: string, roomId: string) {
		try {
			const isNotOwner = !await this.is(userId).OwnerOf(roomId);
			if (isNotOwner)
				return false;
			const where = { id: roomId };
			const saltOrRounds = 10;
			password = await bcrypt.hash(password, saltOrRounds);
			const data = { password };
			this.prisma.room.update({ where, data });
			return true
		} catch (e) {
			Logger.debug(e, "setPassword")
		}
	}

	private async findOrCreateAdministrator(userId: string, roomId: string) {
		const where = { userId_roomId: { userId, roomId } };
		const roomAdministratorFound = await this.prisma.roomAdmin.findUnique({ where });
		if (roomAdministratorFound)
			return (roomAdministratorFound);
		const data = {
			user: { connect: { id: userId } },
			room: { connect: { id: roomId } }
		};
		return (await this.prisma.roomAdmin.create({ data }));
	}

	async setToAdministrator(payload: chatInteractionDto) {
		const userId: string = payload.to.id;
		const roomId: string = payload.room.id
		try {
			if (await this.hasSupperiorRights(payload.from.id, userId, roomId))
				return (await (this.findOrCreateAdministrator(userId, roomId)));
			Logger.debug("you don't have to right to set administrator");
		} catch (e) {
			Logger.debug(e, 'could not set as administrator');
		}
	}

	async kick(payload: chatInteractionDto): Promise<boolean> {
		const userId: string = payload.to.id;
		const roomId: string = payload.room.id
		try {
			if (await this.hasSupperiorRights(payload.from.id, userId, roomId)) {
				const where = { userId_roomId: { userId, roomId } };
				await this.prisma.roomUser.delete({ where });
				return (true);
			}
			return (false);
			Logger.debug("can't kick user with same right");
		} catch (e) {
			Logger.debug('could not kick user from chat')
			return (false);
		}
	}

	async ban(payload: chatInteractionDto): Promise<boolean> {
		const userId: string = payload.to.id;
		const roomId: string = payload.room.id;
		try {
			if (await this.hasSupperiorRights(payload.from.id, userId, roomId)) {
				const data = {
					room: { connect: { id: roomId } },
					user: { connect: { id: userId } }
				};
				await this.prisma.roomBanned.create({ data });
				const where = { userId_roomId: { userId, roomId } };
				await this.prisma.roomUser.delete({ where });
				return (true);
			}
		} catch (e) {
			Logger.debug('could not ban user ');
			return (false);
		}
	}

	async invite(userId: string, interaction: chatInteractionDto): Promise<boolean> {
		try {
			const userIsNotOwner = !await this.is(userId).OwnerOf(interaction.room.id);
			const userIsNotAdmin = !await this.is(userId).AdminOf(interaction.room.id);
			if (userIsNotOwner && userIsNotAdmin)
				return (false);
			const where = {
				userId_roomId: {
					userId: interaction.to.id,
					roomId: interaction.room.id
				}
			};
			const update = {};
			const create = {
				user: { connect: { id: interaction.to.id } },
				room: { connect: { id: interaction.room.id } }
			};
			const roomuser = await this.prisma.roomUser.upsert({ where, update, create });
			return (true);
		} catch (e) { }
	}

	private async roomsOfUser(userId: string): Promise<any> //TODO: change to roomDto
	{
		try {
			const where = { users: { some: { userId } } };
			const rooms = await this.prisma.room.findMany({ where });
			return (rooms);
		} catch (e) { }
	}

	private async publicRooms(): Promise<RoomDto[]> {
		try {
			const where = { type: { in: [RoomType.PUBLIC, RoomType.PROTECTED] } };
			const rooms = await this.prisma.room.findMany({ where });
			return rooms;
		} catch (e) { }
	}

	async getRooms(userId: string): Promise<RoomDto[]> {
		try {
			const usersRoom = await this.roomsOfUser(userId);
			const publicRoom = await this.publicRooms();
			const rooms = [...usersRoom || [], ...publicRoom || []];
			return rooms;
		} catch (e) { }
	}
	//friendDto
	async findOrCreateRelation(userId: string, friendId: string): Promise<any> {
		if (userId === friendId)
			return (undefined);
		const where = { userId_friendId: { userId, friendId } };
		const include = {
			friend: {
				select: {
					name: true,
				}
			}
		}
		const relationFound = await this.prisma.userUser.findUnique({ where, include });
		if (relationFound)
			return ({
				id: relationFound.id,
				friendship: relationFound.friendship,
				friendId: relationFound.friendId,
				name: relationFound.friend.name,
				userId: relationFound.userId,
				roomId: relationFound.roomId,
			});
		const data = {
			name: 'your room',
			type: RoomType.P2P,
			users: {
				create: [
					{ user: { connect: { id: userId } } },
					{ user: { connect: { id: friendId } } },
				]
			},
			privateRoom: {
				create: [
					{
						user: { connect: { id: userId } },
						friend: { connect: { id: friendId } },
						friendship: false,
					},
					{
						user: { connect: { id: friendId } },
						friend: { connect: { id: userId } },
						friendship: false,
					},
				]
			}
		};
		const select = {
			id: true,
			privateRoom: {
				where: { userId, friendId },
				select: { friend: true, friendship: true }
			}
		};
		const newRelation = await this.prisma.room.create({ data, select });
		return ({
			id: newRelation.privateRoom[0]?.friend.id,
			name: newRelation.privateRoom[0]?.friend.name,
			friendship: newRelation.privateRoom[0]?.friendship,
			roomId: newRelation.id
		});
	}

	//friendDto
	async findOrCreateFriend(userId: string, friendId: string): Promise<any> {
		if (userId === friendId)
			return (undefined);
		const where = { userId_friendId: { userId, friendId } };
		const include = { friend: true };
		const friendFound = await this.prisma.userUser.findUnique({ where });
		if (friendFound) {
			const data = { friendship: true }
			const updated = await this.prisma.userUser.update({ where, data, include });
			return ({
				id: updated.friend.id,
				name: updated.friend.name,
				roomId: updated.roomId,
				friendship: updated.friendship,
			});
		}
		const data = {
			name: 'room.name',
			type: RoomType.P2P,
			users: {
				create: [
					{ user: { connect: { id: userId } } },
					{ user: { connect: { id: friendId } } },
				]
			},
			privateRoom: {
				create: [
					{
						user: { connect: { id: userId } },
						friend: { connect: { id: friendId } },
					},
					{
						user: { connect: { id: friendId } },
						friend: { connect: { id: userId } },
						friendship: false,
					},
				]
			}
		};
		const select = {
			id: true,
			privateRoom: {
				where: { userId, friendId },
				select: { friend: true, friendship: true }
			}
		};
		const newFriend = await this.prisma.room.create({ data, select });
		return ({
			id: newFriend.privateRoom[0]?.friend.id,
			name: newFriend.privateRoom[0]?.friend.name,
			friendship: newFriend.privateRoom[0]?.friendship,
			roomId: newFriend.id
		});
	}

	async relationOfUser(userId: string): Promise<any[]> {
		try {
			const where = {
				userId,
				/*
								OR:[
									{room: { messages: {some: {}} }},
									{friendship: true},
								],
				*/
			};
			const include = { friend: true };
			const friends = await this.prisma.userUser.findMany({ where, include });
			const friendsDto = (friend) => {
				return ({
					id: friend.friend.id,
					name: friend.friend.name,
					roomId: friend.roomId,
					friendship: friend.friendship,

					isConnected: friend.friend.isConnected,
					isTalking: friend.friend.isTalking,
					isPlaying: friend.friend.isPlaying,
				});
			}
			return (friends.map(friendsDto));
		} catch (e) {
			Logger.debug(e, 'chat.service friendsOfUser');
			return ([]);
		}
	}

	async listOfMessages(roomId: string): Promise<MessageDto[]> {
		const where = { roomId };
		const messages = await this.prisma.message.findMany({ where }) || [];
		const byDate = (a, b) => (a.date - b.date);
		return (messages.sort(byDate).map(this.transformToMessageDto));
	}

	private async checkPassword(roomId: string, password: string): Promise<boolean> {
		try {
			const where = { id: roomId };
			const room = await this.prisma.room.findUniqueOrThrow({ where });
			return (await bcrypt.compare(password, room.password));
		} catch { return (false); }
	}

	async usersNotInRoom(roomId: string): Promise<any[]> {
		const where = {
			userOf: { none: { roomId: roomId } }
		};
		const select = {
			id: true,
			name: true,
		};
		const users = await this.prisma.user.findMany({ where, select });
		return users;
	}

	async userRelationInRoom(userId: string, userName: string, relationId: string, roomId: string) {
		const hasSup = await this.hasSupperiorRights(userId, relationId, roomId);
		const result = {
			id: userId,
			name: userName,
			isConnected: true,
			isTalking: true,
			isPlaying: false,
			hasSupperiorRights: hasSup
		}
		return ([result]);
	}

	async blockedUsers(userId:string, interaction?: chatInteractionDto) {
		if (interaction && interaction.to.id)
			await this.prisma.blockedUser.create({
				data: {
					blocker: { connect: { id: interaction.from.id } },
					blockedUser: { connect: { id: interaction.to.id } }
				}
			})
		const list = await this.prisma.blockedUser.findMany({
			where: { blockerId: userId }
		});
		return (list.map((e) => e.blockedUserId));
	}

	async userInRoomRelative(userId: string, relativeTo: string, roomId: string ) {
		try {
			const hasSup = await this.hasSupperiorRights(relativeTo, userId, roomId);
			const where = { id: userId };
			const select = {
				id: true,
				name: true,
				isConnected: true,
				isTalking: true,
				isPlaying: true
			}
			const user = await this.prisma.user.findUniqueOrThrow({ where, select });
			const result = { ...user, superiorRights: hasSup }
			return (result);
		}
		catch(e) {
			Logger.debug(e, "userInRoomRelative")
		}
	}
	async usersInRoom(userId: string, roomId: string): Promise<any> {
		try {
			const addRights = async (e: any) => {
				const hasSup = await this.hasSupperiorRights(userId, e.id, roomId);
				const result = { ...e, superiorRights: hasSup }
				return (result);
			}

			const where = {
				NOT: { id: userId },
				userOf: { some: { roomId: roomId } }
			}
			const select = {
				id: true,
				name: true,
				isConnected: true,
				isTalking: true,
				isPlaying: true
			}

			const results = await this.prisma.user.findMany({ where, select });
			const users = await Promise.all(results?.map(addRights));
			return users;
		} catch (e) {
			Logger.debug(e, 'usersInRoom');
			return ([])
		}
	}

	async adminInRoom(userId: string, roomId: string): Promise<any> {
		try {
			const user = this.is(userId);
			if (await user.OwnerOf(roomId))
				return ([]);
			const where = { id: roomId };
			var select;
			if (await user.AdminOf(roomId))
				select = { admins: true };
			else
				select = { users: true };
			const result = await this.prisma.room.findUnique({ where, select });
			const admins = result?.admins.map(e => e.userId);
			return (admins);
		} catch (e) {
			Logger.debug(e, 'adminInRoom');
			return ([]);
		}
	}

	private async findOrCreateUserInRoom(userId: string, roomId: string) {
		const where = { userId_roomId: { userId, roomId } };
		const userFound = await this.prisma.roomUser.findUnique({ where });
		if (userFound)
			return (userFound);
		const data = {
			user: { connect: { id: userId } },
			room: { connect: { id: roomId } }
		}
		const roomUserCreated = await this.prisma.roomUser.create({ data });
		return (roomUserCreated);
	}

	async joinRoom(payload: JoinDto): Promise<boolean> {
		const userId: string = payload.who.id;
		const roomId: string = payload.where.id;
		const password: string = payload.password;

		if (await this.is(userId).BannedFrom(roomId))
			return (false);
		try {
			const where = { id: roomId };
			const room = await this.prisma.room.findUniqueOrThrow({ where });

			const roomIsNotProtected = !(room.type === 'PROTECTED');
			const passwordMatch = await this.checkPassword(roomId, password);
			if (roomIsNotProtected || passwordMatch)
				return (await this.findOrCreateUserInRoom(userId, roomId) ? true : false);
			return (false);
		} catch (error) {
			Logger.error(error, 'joinRoom');
			return (false);
		}
	}

	async leaveRoom(userId: string, roomId: string) {
		try {
			const where = { userId_roomId: { userId, roomId } };
			const result = await this.prisma.roomUser.delete({ where });
			const isAdmin = await this.is(userId).AdminOf(roomId);
			if (isAdmin)
				await this.prisma.roomAdmin.delete({ where });
			const isOwner = await this.is(userId).OwnerOf(roomId);
			if (isOwner)
				await this.prisma.room.update({
					where: { id: roomId },
					data: { owner: { disconnect: true }}
				})
			const roomFound = await this.prisma.room.findUnique({
				where: { id: roomId },
				select: { _count: { select: { users: true } } },
			});
			if (roomFound._count.users != 0)
				return;
			const roomDeleted = await this.prisma.room.delete({ where: { id: roomId } });
		} catch (error) {
			Logger.debug(error, 'leaveRoom');
		}
	}

	async roomSettings(userId: string, settings: roomSettingsDto) {
		try {
			const isOwner = await this.is(userId).OwnerOf(settings.id);
			const {id, oldPassword, ...otherProperties} = settings;
			const room = await this.prisma.room.findUniqueOrThrow({ where: { id } });
			var passwordMatch = true;
			if (otherProperties.password && room.type === 'PROTECTED')
				passwordMatch = await this.checkPassword(id, oldPassword);
			var result = false;
			if (isOwner && passwordMatch) {
				if (otherProperties.password){
					const saltOrRounds = 10;
					otherProperties.password = await bcrypt.hash(otherProperties.password, saltOrRounds);
				}
				await this.prisma.room.update({
					where: { id },
					data: { ...otherProperties }
				})
				result = true;
			}
			return result;
		} catch (e) {
			Logger.debug(e, "roomSettings")
		}
	}
}
