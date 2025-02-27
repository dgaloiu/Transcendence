<template>
	<div>
		<canvas
			ref="canvasElement"
			v-bind:class="{
				'canvas-class':true,
				'maintain-aspect-ratio': true
			}"></canvas>
		<button v-if="props.launch === 'false'" @click="startGame_local()">Find game</button>
		<ModalSettings v-model:show="show_modal" @settings="launchGame" />
	</div>
</template>

<script setup lang="ts">
	import ModalSettings from '@/components/game/ModalSettings.vue';

	import type { Ref } from 'vue'
	import { defineModel, defineProps, onMounted, onUnmounted, ref } from 'vue'

	import { useUserStore } from '@/stores/user';
	import { useGameStore } from "@/stores/game";

	const userStore = useUserStore();
	const store = useGameStore();

	const props = defineProps({
		launch: {
			type: String,
			required: true,
			default: 'false',
		},
	});

	const launchGame = (data) => {
		store.inviteFriendsSettings(data);
		startGame_local();
	}

	const show_modal = ref(false);
	const canvasElement: Ref<HTMLCanvasElement | undefined> = ref();
	var ctx: Ref<CanvasRenderingContext2D | undefined> = ref();
	var gameLoopId = ref(undefined);

	const x_ratio = ref(1);
	const y_ratio = ref(1);

	let resizeTimeout: ReturnType<typeof setTimeout>;

	const paddle_width = 5;
	const width = 858;
	const height = 525;

	import { makeObject } from '@/utils/objectBuilder'
	import type { gameSettingDto } from '../shared/game.interfaces'
	const eventsListener = makeObject(
		[
			['keydown', move_paddle],
			['resize', resizeCanvas],
			['visibilitychange', quitGame],
		],
		([eventName, callback]) => ([eventName, {
			on: () => window.addEventListener(eventName, callback),
			off: () => window.removeEventListener(eventName, callback),
		}])
	);

	onMounted(() => {
		ctx.value = canvasElement.value?.getContext('2d') || undefined;
		eventsListener.keydown.on();
		eventsListener.resize.on();
		eventsListener.visibilitychange.on();

		resizeCanvas();

		store.connect();
		store.onGameStart(gameLoop)
/*
		if (props.launch === 'true') {
			startGame_local();
		}
*/
	});

	onUnmounted(() => {
		userStore.emitters.quitPlaying()
		eventsListener.keydown.off();
		eventsListener.resize.off();
		eventsListener.visibilitychange.off();
		cancelAnimationFrame(gameLoopId.value);
		clearTimeout(resizeTimeout);
		ctx.value = null;
		store.quitGame();
		//quitGame();
	});

	const normalSettings: gameSettingsDto = {
		winScore: 11,
		paddleSize: 80,
		paddleSpeed: 35,
		ballSize: 10,
		ballSpeed: 3,
		speedIncrease: 0.3,
		gameColor: 'white'
	}

	function startGame_local() {
		if (!ctx.value || ctx.value == undefined) {
			return;
		}

		userStore.emitters.isPlaying();
		if (props.launch === 'false')
			store.joinGame(normalSettings);
		requestAnimationFrame(gameLoop);
	}

	let previousTimeStamp = 0;
	const timestep = 1000 / 120;

	function gameLoop(timeStamp) {
		if (!ctx.value && gameLoopId.value) {
			cancelAnimationFrame(gameLoopId.value);
			return ;
		}

		if ((timeStamp - previousTimeStamp) < timestep) {
			gameLoopId.value = requestAnimationFrame(gameLoop);
			return;
		}

		if (store.onGameStop (
			() => { draw_message("Opponent left... You won!") },
			(win) => { draw_message(win ? "You won!" : "You lost!") },
		)) {
			resetGame();
			return ;
		}

		if (store.isGameStarted) {
			store.move_my_ball();
			draw_background();
			draw_ball_local();
			draw_paddles();
			draw_score_local();
		}
		else if (props.launch === 'false')
			draw_match_making();
		previousTimeStamp = timeStamp;
		gameLoopId.value = requestAnimationFrame(gameLoop);
	}
	/*
function gameLoop(timeStamp) {
		if (!ctx.value && gameLoopId.value) {
			cancelAnimationFrame(gameLoopId.value);
			return ;
		}
		if ((timeStamp - previousTimeStamp) >= timestep) {
			if (store.isGameStarted) {
				store.move_my_ball();
				draw_background();
				draw_ball_local();
				draw_paddles();
				draw_score_local();
			}
			else if (props.launch === 'false')
				draw_match_making();
			previousTimeStamp = timeStamp;
		}
		if (store.onGameStop (
			() => { draw_message("Opponent left... You won!") },
			(win) => { draw_message(win ? "You won!" : "You lost!") },
		)) {
			resetGame();
			return ;
		}
		gameLoopId.value = requestAnimationFrame(gameLoop);
	}
	*/

	function move_paddle(event: KeyboardEvent) {
		const keyPressed = event.code;

		switch (keyPressed){
			case "KeyS":
			case "ArrowDown":
				store.move_my_paddle(store.Settings.paddleSpeed);
				break;
			case "KeyW":
			case "ArrowUp":
				store.move_my_paddle(-store.Settings.paddleSpeed);
				break;
		}
	}

	function resetGame() {
		store.quitGame();
		cancelAnimationFrame(gameLoopId.value);
		gameLoopId.value = 0;
	}

	function quitGame() {
		if (document.visibilityState === 'hidden') {
			ctx.value = null;
			resetGame();
		}
		else if(document.visibilityState === 'visible'){
			setTimeout(() => {ctx.value = canvasElement.value?.getContext('2d') || undefined;
								ctx.value.clearRect(0, 0, canvasElement.value!.width, canvasElement.value!.height);} 
			, 100);
		}
	}

	function resizeCanvas() {
		if (resizeTimeout) {
			clearTimeout(resizeTimeout);
		}
		resizeTimeout = setTimeout(function() {
			const aspectRatio = 858 / 525;
			const windowWidth = window.innerWidth * 0.8;
			const windowHeight = window.innerHeight * 0.8;

			let newWidth, newHeight;

			if (windowWidth / windowHeight > aspectRatio) {
				/*
				Window is wider than the desired aspect ratio,
				so we fit the width to the window width
				and calculate the height based on the aspect ratio
				*/
				newHeight = windowHeight;
				newWidth = newHeight * aspectRatio;
			} else {
				/*
				Window is taller than the desired aspect ratio,
				so we fit the height to the window height
				and calculate the width based on the aspect ratio
				*/
				newWidth = windowWidth;
				newHeight = newWidth / aspectRatio;
			}
			canvasElement.value!.width = newWidth;
			canvasElement.value!.height = newHeight;
			x_ratio.value = canvasElement.value!.width / 858;
			y_ratio.value = canvasElement.value!.height / 525;
		}, 100);
	}

	function draw_background() {
		if (!ctx.value || !canvasElement.value)
			return ;
		ctx.value.clearRect(0, 0, canvasElement.value!.width, canvasElement.value!.height);

		//draw_middle_line();
		ctx.value.fillStyle = store.Settings.gameColor;
		ctx.value.setLineDash([3, 4]);
		ctx.value.fillRect(canvasElement.value!.width/2, 0, 1, canvasElement.value!.height);
		ctx.value.strokeRect(canvasElement.value!.width/2, 0, 0, canvasElement.value!.height);
	}

	function draw_paddles() {
		if (!ctx.value || !canvasElement.value)
			return ;
		ctx.value.fillStyle = store.Settings.gameColor;
		ctx.value.fillRect(
			store.DistFromSide*x_ratio.value,
			(store.PaddleLeft-store.DistFromSide)*y_ratio.value,
			paddle_width*x_ratio.value,
			store.Settings.paddleSize * y_ratio.value
		);
		ctx.value.fillRect(
			(width - paddle_width - store.DistFromSide) * x_ratio.value,
			(store.PaddleRight - store.DistFromSide) * y_ratio.value,
			paddle_width*x_ratio.value,
			store.Settings.paddleSize*y_ratio.value
		);
	}

	function draw_ball_local() {
		if (!ctx.value || !canvasElement.value)
			return ;
		ctx.value.fillStyle = store.Settings.gameColor;
		ctx.value.fillRect(
			(store.ball.x-store.HalfBallSize*x_ratio.value)*x_ratio.value,
			(store.ball.y-store.HalfBallSize*y_ratio.value)*y_ratio.value,
			store.Settings.ballSize*x_ratio.value,
			store.Settings.ballSize*y_ratio.value
		);
	}

	function draw_score_local() {
		if (!ctx.value || !canvasElement.value)
			return;
		ctx.value.font = "40px Calibri";
		ctx.value.fillStyle = store.Settings.gameColor;
		ctx.value.fillText(
			`${store.Score.mine}`,
			canvasElement.value!.width/2*(4/6),
			canvasElement.value!.height/5
		);
		ctx.value.fillText(
			`${store.Score.opponent}`,
			canvasElement.value!.width/2*(7/6),
			canvasElement.value!.height/5
		);
	}

	function draw_match_making () {
		if (!ctx.value || !canvasElement.value)
			return;
		ctx.value.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height);
		ctx.value.fillStyle = store.Settings.gameColor;
		ctx.value.font = "20px 'Press Start 2P'";
		ctx.value.fillText(
			"Matchmaking...",
			3/10*canvasElement.value!.width,
			canvasElement.value!.height/2
		);
	}

	function draw_message (message) {
		if (!ctx.value || !canvasElement.value)
			return;
		ctx.value.clearRect(0, 0, canvasElement.value!.width, canvasElement.value!.height);
		if (!message)
			return ;
		ctx.value.fillStyle = store.Settings.gameColor;
		ctx.value.font = "30px 'Press Start 2P'";
		ctx.value.fillText(message, 3/10*canvasElement.value!.width, canvasElement.value!.height/2);
	}

</script>

<style>
.canvas-class {
	border: 3px solid red,
	background-color: black,
	maintain-aspect-ratio: {
		width: 80%;
		height: auto;
		aspect-ratio: 858 / 525
	}
}
</style>
