import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { io } from "socket.io-client";
import { request } from "../utils/fetch";
import { useRouter } from 'vue-router'
import { jwtDecode } from "jwt-decode";

import { useChatStore } from '@/stores/chat'
import { usePopupStore } from '@/stores/popup'
import { useGameStore } from '@/stores/game'

const apiUrl: string = import.meta.env.VITE_HOST + '/api';

type User = {
	id: string;
	name: string;
}

type Tokens = {
	access: string;
	refresh: string;
}

async function getBlob(response) {
	const reader = response.body.getReader();
	const readableStream = new ReadableStream({
		start(controller) {
			return pump();
			function pump() {
				return reader.read().then(({ done, value }) => {
					if (done) {
						controller.close();
						return;
					}
					controller.enqueue(value);
					return pump();
				});
			}
		},
	});
	const stream = new Response(readableStream);
	const blob = await stream.blob();
	return (URL.createObjectURL(blob));
}

function isTokenValid(token: string): any | null {
	if (!token)
		return (null);
	const decoded = jwtDecode(token);
	const exp = decoded.exp * 1000;
	const now = Date.now().valueOf();
	if (decoded && now < exp) {
		return ({ token, decoded });
	}
	return (null);
}

function isCookieTokenValid(cookieName: string): any | null {
	const token = window.localStorage.getItem(cookieName);
	return (isTokenValid(token));
}

function setCookieTokens(tokens: Tokens) {
	window.localStorage.setItem('access', tokens.access);
	window.localStorage.setItem('refresh', tokens.refresh);
}

function store()
{
	window.onbeforeunload = function(e) {
		logout();
	};

	const router = useRouter();
	const popupStore = usePopupStore();
	const user = reactive({
		signed: false,
		id: undefined,
		name: undefined,
	});

	const showInvitation = ref(false);
	const player = reactive({
		id: undefined,
		name: undefined,
	});

	const doubleAuthentification = ref(false);

	async function getAvatar(id: string) {
		const payload = JSON.stringify({ id });
		const contentType = {
			name: 'Content-Type',
			value: 'application/json',
		}
		const responseImg = await request_host.value.
			request('/users/avatar')
			.headers([contentType])
			.post('', payload);
		if (responseImg.status === 202)
			return ("https://www.testhouse.net/wp-content/uploads/2021/11/default-avatar.jpg");
		const blob = await getBlob(responseImg);
		return (blob);
	}

	async function submitAvatar(event) {
		const form = event.currentTarget;
		const response = await request_host.value
			.post('/users/upload', new FormData(form));
		if (response.ok)
			user.avatar = await getAvatar(user.id);
	}

	async function getHistory(id: string) {
		const payload = JSON.stringify({ id });
		const contentType = {
			name: 'Content-Type',
			value: 'application/json',
		}
		const response = await request_host.value.
			request('/users/history')
			.headers([contentType])
			.post('', payload);
		if (response.ok === false)
			return ([]);
		return (await response.json());
	}

	async function getLeaderBoard() {
		const response = await request_host.value.get('/users/leaderBoard');
		if (response.ok === false)
			return ([]);
		return (await response.json());
	}

	addEventListener("load", async (event) => {
		const validity = isCookieTokenValid('access');
		if (validity === null)
			await refreshToken();
		await login();
	});

	const authorizationHeaders = {
		name: 'Authorization',
		value: async () => `Bearer ${await getToken()}`
	};
	const request_api = request(apiUrl);
	const request_host = ref(request(apiUrl).headers([authorizationHeaders]));
	const request_auth = request_host.value.request('/auth');

	async function fetch42Access(query) {
		const searchParams = new URLSearchParams(query)
		const url = '/login?' + searchParams.toString();
		const response = await request(apiUrl + '/auth').get(url);

		if (response.ok == false || response.status === 202)
			return;
		const data = await response.json(); //supposer we receive only tokens
		user.id = data.id;
		user.name = data.name;
		if (data.doubleAuth) {
			doubleAuthentification.value = true;
			return;
		}
		setCookieTokens(data.token);
		await login();
	}

	async function refreshToken(): void {
		const refresh = isCookieTokenValid('refresh');
		if (refresh === null)
			return;
		const authorization = {
			name: 'Authorization',
			value: () => `Bearer ${refresh.token}`
		};
		const response = await request_auth.headers([authorization]).get('/refresh');
		if (response.ok) {
			setCookieTokens(await response.json());
		}
		else
			await logout();
	}

	async function getToken(callback?: any) {
		const validity = isCookieTokenValid('access');
		if (validity)
			return (validity.token);
		await refreshToken();
		if (callback)
			callback();
		return (window.localStorage.getItem('access'));
	}

	function create_socket(namespace: string) {
		const socket_io = io(namespace, {
			autoConnect: false,
			auth: { id: user.id },
		});

		socket_io.on = (function (_super) {
			return async function () {
				const eventName = arguments[0];
				const callback = (function (_super) {
					return function () {
						return _super.apply(this, arguments);
					}
				})(arguments[1])
				return _super.apply(this, [eventName, callback]);
			};
		})(socket_io.on)

		const makeMiddleware = (emitter: string) => {
			const middleware = (function (_super) {
				return async function () {
					const callBack = () => {
						socket_io.on("disconnect", (reason) => {
							socket_io.connect();
							socket_io[emitter](arguments[0], arguments[1]);
						});
						socket_io.disconnect();
					};
					const token = await getToken(callBack);
					return _super.apply(this, arguments);
				};
			})(socket_io[emitter]);
			return (middleware);
		};

		socket_io.emitWithAck = makeMiddleware('emitWithAck');
		socket_io.emit = makeMiddleware('emit');
		return (socket_io);
	}

	function TwoFactor() {
		const QrCode = async () => {
			const response = await request_auth.post('/2fa/register');
			const blob = await response.blob();
			return (URL.createObjectURL(blob));
		};

		const Submit = async (code: number) => {
			const payload = JSON.stringify({
				id: user.id,
				_2fa_code: code,
			});
			const contentType = {
				name: 'Content-Type',
				value: 'application/json',
			}
			const response = await request_auth
				.request('/2fa/turn-on')
				.headers([contentType])
				.post('', payload);
			doubleAuthentification.value = response.ok;
			return (response.ok);
		}

		const TurnOff = async (code: number) => {
			const payload = JSON.stringify({
				id: user.id,
				_2fa_code: code,
			});
			const contentType = {
				name: 'Content-Type',
				value: 'application/json',
			}
			const response = await request_auth
				.request('/2fa/turn-off')
				.headers([contentType])
				.post('', payload);
			if (response.ok)
				doubleAuthentification.value = false;
			return (response.ok);
		}

		const Authenticate = async (code: number) => {
			const payload = JSON.stringify({
				user: {
					id: user.id,
					name: user.name,
					doubleAuth: true,
				},
				_2fa_code: code,
			});
			const contentType = {
				name: 'Content-Type',
				value: 'application/json',
			}
			const response = await request_auth
				.request('/2fa/authenticate')
				.headers([contentType])
				.post('', payload);
			if (response.ok == false)
				return (false);
			setCookieTokens(await response.json());
			login(); //is it ok??
			return (true);
		}

		return ({
			QrCode,
			Submit,
			Authenticate,
			TurnOff,
		});
	}

	const global_socket = ref(undefined);
	const GlobalEvent = (function () {
		var callbacksList = [];
		const callBackArg = (field: name) => (state: boolean) => (userId: string) => {
			for (var caller of callbacksList)
				caller(field, state, userId);
		}

			var settings;
		const callbacks = {
			on: (string, arg) => { },
			emit: (string, arg) => { },
			emitWithAck: (string, arg) => { },
		};

		var invitation = (friendId: string) => { };
		const inviteToPlay = (friendId: string) => { invitation(friendId) };

		const closeInvitation = () => {
			showInvitation.value = false
		};
		var gameStore = undefined;
		const setCallbacks = (emit, emitWithAck, on) => {
			gameStore = useGameStore();

			callbacks.emit = emit;
			callbacks.emitWithAck = emitWithAck,
			callbacks.on = (eventName, callback) => {
				on(eventName, (arg) => {
					callback(arg)
				});
			}

			[
				['isConnected', ['isConnected', 'isNoLongerConnected']],
				['isTalking', ['isTalking', 'quitTalking']],
				['isPlaying', ['isPlaying', 'quitPlaying']],
			].forEach(([field, [True, False]]) => {
				const call = callBackArg(field);
				callbacks.on(True, call(true));
				callbacks.on(False, call(false));
			});

			callbacks.on('invitationCanceled', () => { closeInvitation() });

			callbacks.on('inviteToPlay', (arg) => {
				player.name = arg.userName;
				player.id = arg.userId;
				showInvitation.value = true;
				settings = arg.settings;
			});

			callbacks.on('invitationResponse', (arg) => {
				if (gameStore === undefined) {
					popupStore.close();
					return;
				}
				popupStore.close();
				if (arg.ok) {
					router.push({
						name: 'game',
						params: {
							launch: 'true',
						}
					});
					gameStore.inviteFriendsSettings(arg.settings);
					return;
				}
				return;
			});

			invitation = (inviteGameDto: any) => {
				player.id = inviteGameDto.opponentId;
				callbacks.emit('inviteToPlay', {
					userId: user.id,
					userName: user.name,
					friendId: player.id,
					settings: inviteGameDto,
				});
			}
		}

		const invitationCanceled = () => {
			callbacks.emit('invitationCanceled', player.id);
		}

		const invitationResponse = async (ok) => {
			const response = await callbacks.emitWithAck('invitationResponse', {
				ok: ok,
				userId: user.id,
				userName: user.name,
				friendId: player.id,
				settings: settings,
			});
			if (response) {
				router.push({
					name: 'game',
					params: {
						launch: 'true',
					}
				});
			}
		}

		const updateName = async (name: string) => {
			const ok = await callbacks.emitWithAck('updateName', name);
			if (ok)
				user.name = name;
			return (ok);
		}

		const result = [
			'isConnected', 'isNoLongerConnected',
			'isTalking', 'quitTalking',
			'isPlaying', 'quitPlaying',
		].reduce((result, eventName: string) => ({
			...result,
			[eventName]: () => { callbacks.emit(eventName, user.id) }
		}), {} as { [name: string]: () => {} });

		result.isNoLongerConnected = (function (_super) {
			return function () {
				result.quitTalking();
				result.quitPlaying();
				return _super.apply(this, arguments);
			};
		})(result.isNoLongerConnected);

		const { isConnected, isNoLongerConnected, ...emitters } = result;


		return ({
			in: {
				isConnected, isNoLongerConnected, setCallbacks,
			},
			out: {
				updateName,
				inviteToPlay,
				invitationResponse,
				invitationCanceled,
				closeInvitation,
				emitters,
				addGlobalEventCallback: (callback) => callbacksList.push(callback),
			}
		})
	})();

	async function login(): void {
		const validity = isCookieTokenValid('access');
		if (validity === null)
			return;
		user.signed = true;
		user.id = validity.decoded.id;
		user.name = validity.decoded.name;

		global_socket.value = create_socket('/userState');
		global_socket.value.connect();
		GlobalEvent.in.setCallbacks(
			(eventName: string, arg: any) => {
				return (global_socket.value.emit(eventName, arg));
			},
			(eventName: string, arg: any) => {
				return (global_socket.value.emitWithAck(eventName, arg));
			},
			(eventName: string, arg: any) => {
				return (global_socket.value.on(eventName, (data) => {
					arg(data);
				}));
			}
		);
		GlobalEvent.in.isConnected();
		useChatStore();
	}

	async function logout() {
		await request_auth.get('/logout');
		GlobalEvent.in.isNoLongerConnected();
		user.signed = false;
		user.id = undefined;
		window.localStorage.removeItem(`access`);
		window.localStorage.removeItem(`refresh`);
	}

	return {
		///
		signed: computed(() => user.signed),
		userId: computed(() => user.id),
		userName: computed(() => user.name),
		avatar: computed(() => user.avatar),
		///

		user: computed(() => user),
		TwoFactor: TwoFactor(),
		doubleAuth: computed(() => doubleAuthentification.value),

		fetch42Access,
		submitAvatar,
		getAvatar, getHistory, getLeaderBoard,

		showInvitation: computed(() => showInvitation.value),
		player: computed(() => player),

		create_socket,
		requestJwt: computed(() => request_host.value.request),
		logout,
		...GlobalEvent.out,

	};
}

export const useUserStore = defineStore('user', store);
