import { defineStore } from 'pinia'
import { useUserStore } from "../stores/user";
import { ref, reactive, computed } from 'vue'
import type {
	Ball,
	gameSettingsDto, gameBallDto, gameDto, gamePaddleDto
} from '../shared/game.interfaces';
import { server } from 'typescript';

function store() {
	const userStore = useUserStore();
	const socket = userStore.create_socket('/game');

	const settings: GameSettingsDto = reactive({
		winScore: 3,
		paddleSize: 80,
		paddleSpeed: 35,
		ballSize: 10,
		ballSpeed: 3,
		speedIncrease: 0.3,
		gameColor: 'white',
	});

	const normalSettings: gameSettingsDto = {
		winScore: 3,
		paddleSize: 80,
		paddleSpeed: 35,
		ballSize: 10,
		ballSpeed: 3,
		speedIncrease: 0.3,
		gameColor: 'white',
	};

	function assignSettings(newSettings: GameSettingsDto) {
		settings.winScore = newSettings.winScore;
		settings.paddleSize = newSettings.paddleSize;
		settings.paddleSpeed = newSettings.paddleSpeed;
		settings.ballSize = newSettings.ballSize;
		settings.ballSpeed = newSettings.ballSpeed;
		settings.speedIncrease = newSettings.speedIncrease;
		settings.gameColor = newSettings.gameColor;
	}

	const ball_: Ball = reactive({
		x: 0,
		y: 0,
		dirX: 0,
		dirY: 0,
		speed: 3
	});

	const gameId = ref("undefined");

	const start_game = ref(false);

	const Score = reactive({
		mine: 0,
		opponent: 0,
	});

	const width = ref(858);
	const height = ref(525);

	const paddle_left = ref(525 / 2);
	const paddle_right = ref(525 / 2);

	const game_aborted = ref(false);

	const dist_from_side = ref(40);
	const holes_limit = ref(80);
	const half_ball_size = ref(5);
	const playerOne = ref(true);

	socket.on('movePaddle', (payload: gamePaddleDto) => {
		paddle_right.value = payload.myPaddlePos;
	});

	socket.on('updateBall', (payload: gameBallDto) => {
		ball_.x = payload.ball.x;
		ball_.y = payload.ball.y;
		ball_.dirX = payload.ball.dirX;
		ball_.dirY = payload.ball.dirY;
		ball_.speed = payload.ball.speed;
		if (playerOne.value == true) {
			ball_.dirX = -1 * ball_.dirX;
			ball_.x = 858 - ball_.x;
		}
	});

	socket.on('newGame', (payload: gameDto) => {
		resetGame();
		gameId.value = payload.gameId;
		assignSettings(payload);
		ball_.speed = payload.ballSpeed;
		playerOne.value = (payload.players[0] == userStore.user.id);
		start_game.value = true;
		callbackStartGame();
	});

	socket.on('lostPoint', () => { Score.opponent += 1 });
	socket.on('winPoint', () => { Score.mine += 1 });
	socket.on('abortGame', () => game_aborted.value = true);

	function move_my_paddle(new_value: number) {
		paddle_left.value += new_value;
		if (paddle_left.value < holes_limit.value)
			paddle_left.value = holes_limit.value;
		if (paddle_left.value > height.value - holes_limit.value)
			paddle_left.value = height.value - holes_limit.value;

		socket.emit('movePaddle', {
			gameId: gameId.value,
			myPaddlePos: paddle_left.value
		} as gamePaddleDto);
	}

	function move_my_ball() {
		if (ball_.y - settings.ballSize / 2 < 0 || ball_.y + settings.ballSize / 2 > height.value)
			ball_.dirY *= -1;
		ball_.x += ball_.dirX * ball_.speed;
		ball_.y += ball_.dirY * ball_.speed;
	}

	function inviteFriendsSettings(settings: gameSettingsDto) {
		socket.emit('inviteFriend', settings);
	}

	function resetGame() {
		Score.mine = 0;
		Score.opponent = 0;

		paddle_left.value = height.value / 2;
		paddle_right.value = height.value / 2;

		start_game.value = false;
		game_aborted.value = false;

		settings.value = normalSettings;
		ball_.speed = 0;
	}

	function quitGame() {
		if (start_game.value)
			socket.emit('quitGame', gameId.value);
		resetGame();
	}

	function onGameStop(onAborted, onWin) {
		if (game_aborted.value) {
			onAborted();
			resetGame();
			return (true);
		}
		if (Score.mine >= settings.winScore || Score.opponent >= settings.winScore) {
			onWin(Score.mine == settings.winScore)
			resetGame();
			return (true);
		}
		return (false);
	}

	var callbackStartGame = () => { };
	function onGameStart(callback) {
		callbackStartGame = callback;
	}

	return ({
		Settings: computed(() => settings),
		Score,
		onGameStop,
		onGameStart,
		joinGame: (settings) => { socket.emit('joinGame', settings) },

		isGameStarted: computed(() => start_game.value),

		PaddleLeft: computed(() => paddle_left.value),
		PaddleRight: computed(() => paddle_right.value),

		ball: computed(() => ball_),

		quitGame,

		HalfBallSize: computed(() => half_ball_size.value),
		DistFromSide: computed(() => dist_from_side.value),

		move_my_paddle,
		move_my_ball,

		inviteFriendsSettings,
		connect: () => { socket.connect() },
	});
}
export const useGameStore = defineStore("game", store)
