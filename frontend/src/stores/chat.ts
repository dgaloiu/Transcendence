import { ref, toRaw, computed, reactive } from 'vue'
import { defineStore } from 'pinia'

import { Same, Field } from '@/utils/array'
import { useUserStore } from '@/stores/user'
import { usePopupStore } from '@/stores/popup'
import { useRouter } from 'vue-router'

import type {
	CreateRoomDto,
	WhoDto,
	RoomDto,
	JoinDto,
	MessageDto,
} from '../shared/chat.interfaces'


function relationStore(socket: any) {

	const userStore = useUserStore();
	const list = reactive(new Map);
	const values = () => Array.from(list.values());

	socket.on("privateMessage", async (arg) => {
		const blocked = await socket.emitWithAck('blockUser');
		if (blocked.find((id) => id === arg.id) === undefined)
			list.set(arg.id, arg)
	});

	async function addFriend(userId:string, friendId:string) {
		// si on le trouve dans le list des message prive on le deplace dans la list des amis
		const interaction:chatInteractionDto = {
			from : { id: userId },
			to : { id : friendId },
		}
		const newFriend = await socket.emitWithAck("addFriend", interaction);
		list.set(newFriend.id, newFriend);
	}

	function updateUsersState(field:string, state:boolean, userId:string) {
		if (userId === userStore.user.id)
			return ;
		if (list.has(userId)) {
			const user = list.get(userId);
			user[field] = state;
			list.set(userId, user);
		}
	}
	userStore.addGlobalEventCallback(updateUsersState);

	socket.on("getRelations", (users:any[]) => {
		users.forEach((user:any) => {
			list.set(user.id, user);
		})
	});

	async function privateMessage(receiverId:string) { //last one {
		const interaction:chatInteractionDto = {
			from: {
				id: userStore.user.id,
				name: userStore.user.name,
			},
			to: { id: receiverId },
		};
		const response = await socket.emitWithAck('privateMessage', interaction)
		return (response);
	}

	return ({
		friends: computed(() => values()),
		addFriend,
		privateMessage,
		isFriend: (userId:string) => list.has(userId) && list.get(userId).friendship,
	});
}

function roomStore(socket: any) {

	const list = ref<RoomDto[]>([]);

	function createRoom(new_room: CreateRoomDto) {
		socket.emit('createRoom', new_room);
		return (true);
	}

	socket.on("getRooms", (arg) => {
		list.value.addUniqueBy(Same.field('id'))(arg);
	});

	const getRoomById = (roomId:string):RoomDto => list.value.find(Field('id').equal(roomId));
	const removeRoomById = (roomId:string):void => list.value.removeBy(Field('id').equal(roomId));

	return ({
		rooms: computed(() => list.value),
		createRoom,
		getRoomById,
		removeRoomById,
	});
}

function store()
{
	const userStore = useUserStore();
	const popupStore = usePopupStore();
	const socket = userStore.create_socket('/chat');

	const router = useRouter();
	const room_store = roomStore(socket);
	const friend_store = relationStore(socket);

	socket.connect();
	const rooms = reactive(new Map);
	const newEmptyRoom = () => ({
		messages: [],
		users: new Map(),
	});

	const messages = computed(() => (roomId: string) => rooms.get(roomId)?.messages)

	socket.on("new_incomming_message", async (payload:any) => {
		if (rooms.has(payload.roomId) === false)
			return;
		var room = rooms.get(payload.roomId);
		const blocked = await socket.emitWithAck('blockUser');
		const messages = payload.messages.filter((msg) => {
			return (blocked.find((id) => id === msg.from.id) === undefined);
		})
		room.messages.addUniqueBy(Same.field('id'))(messages);
		rooms.set(payload.roomId, room);
	});

	function send_message(roomId: string, message: string) {
		socket.emit("message", {
			from: {
				id: userStore.user.id,
				name: userStore.user.name,
			},
			to: { id: roomId, name: 'tATA' },
			message
		});
	}

	socket.on('updateRights', (arg) => {
		if (rooms.has(arg.roomId) === false)
			return ;
		const user = rooms.get(arg.roomId).users.set(arg.user.id, arg.user);
	});

	const rights = computed(() => (roomId:string, userId:string) => {
		const user = rooms.get(roomId).users.get(userId);
		return (user && user.superiorRights);
	});

	async function join(roomId: string, password?: string) {
		const payload: JoinDto = {
			who: {
				id: userStore.user.id,
				name: userStore.user.name,
			},
			where: { id: roomId },
			password: password,
		}
		const response = await socket.emitWithAck('join', payload);
		if (response.ok == false)
			return (false);

		var room = rooms.get(roomId);
		if (room === undefined)
			room = newEmptyRoom();

		const blocked = await socket.emitWithAck('blockUser');
		const messages = response.messages.filter((msg) => {
			return (blocked.find((id) => id === msg.from.id) === undefined);
		})
		room.messages.addUniqueBy(Same.field('id'))(messages);
		response.users.forEach((user) => {
			room.users.set(user.id, user);
		});
		rooms.set(roomId, room);
		return (response.ok);
	}

	function makeInteractionDto(userId:string, roomId?:string): chatInteractionDto {
		const interaction:chatInteractionDto = {
			from: {
				id: userStore.user.id,
				name: userStore.user.name,
			},
			to: { id: userId },
			room: { id: roomId },
		};
		return (interaction);
	}

	function makeAdmin(userId:string, roomId:string) {
		var newAdmin = rooms.get(roomId).users.get(userId);
		newAdmin.superiorRights = true
		rooms.get(roomId).users.set(userId, newAdmin);
		socket.emit('makeAdmin', makeInteractionDto(userId, roomId));
	}

	function blockUser(blockedId:string) {
		socket.emit('blockUser', makeInteractionDto(blockedId));
	}

	function kick(userId:string, roomId:string) {
		socket.emit('kick', makeInteractionDto(userId, roomId));
	}

	function mute(userId:string, roomId:string) {
		socket.emit('mute', makeInteractionDto(userId, roomId));
	}

	function ban(userId:string, roomId:string) {
		socket.emit('ban', makeInteractionDto(userId, roomId));
	}

	async function roomSettings(arg:any) {
		return (await socket.emitWithAck('roomSettings', arg));
	}

	async function usersNotInRoom(roomId:string) {
		return (await socket.emitWithAck('usersNotInRoom', roomId));
	}

	function inviteUser(userId:string, roomId:string) {
		const interaction:chatInteractionDto = {
			from: {
				id: userStore.user.id,
				name: userStore.user.name,
			},
			to: { id: userId },
			room: { id: roomId },
		};
		socket.emit('invite', interaction);
	}

	socket.on('madeAdmin', (arg) => {
		if (userStore.user.id === arg.to.id) {
			const room = rooms.get(arg.room.id);
			room?.users.forEach((value, key) => {
				value.superiorRights = false;
				rooms.get(arg.room.id).users.set(key, value);
			})
			popupStore.emit("You are now Admin", "lmao");
		} else {
			var newAdmin = rooms.get(arg.room.id).users.get(arg.to.id);
			newAdmin.superiorRights = true
			rooms.get(arg.room.id).users.set(arg.to.id, newAdmin);
		}
	});

	socket.on('youAreBanned', (roomId:string) => {
		popupStore.emit("You are banned", "lmao");
	});

	socket.on('youAreMuted', (roomId:string) => {
		popupStore.emit("You are muted", "lmao");
	});

	socket.on('invited', (roomId:string) => {
		popupStore.emit("You are invited", "lmao");
	});

	socket.on('youAreKicked', () => {
		router.push({ path: '/chat' })
		popupStore.emit("You've been Kicked", "lmao");
	});

	function leaveRoom(roomId:string) {
		socket.emit('leaveRoom', roomId);
		room_store.removeRoomById(roomId);
		router.push({ path: '/chat' });
	}

	return {
		rights,
		send_message,
		join,

		ban,
		makeAdmin,
		blockUser,
		roomSettings,
//		play,
		kick,
		mute,
		usersNotInRoom,
		inviteUser,

		leaveRoom,

		messages,
		...room_store,
		...friend_store,
	};
}
export const useChatStore = defineStore('chat', store);
