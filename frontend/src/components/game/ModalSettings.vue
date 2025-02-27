<template>
	<Modal v-model:show='show'>
		<template v-slot:header>
			<h2>Game Settings</h2>
		</template>
	  	<template v-slot:content>
			<div style="display: flex; flex-direction: column;">
				<div style="display: flex; justify-content: space-between;">
					<label for="win-score">Win Score:</label>
					<select id="win-score" v-model.number="settings.winScore">
			  			<option value=1>1</option>
			  			<option value=3>3</option>
			  			<option value=5>5</option>
			  			<option value=11>11</option>
			  			<option value=21>21</option>
			  			<option value=42>42</option>
					</select>
		  		</div>
		  		<div style="display: flex; justify-content: space-between;">
					<label for="paddle-size">Paddle Size:</label>
					<select id="paddle-size" v-model.number="settings.paddleSize">
			  			<option value=20>Small</option>
			  			<option value=80>Standard</option>
			  			<option value=120>Big</option>
					</select>
		  		</div>
				<div style="display: flex; justify-content: space-between;">
					<label for="paddle-speed">Paddle Speed:</label>
					<select id="paddle-speed" v-model.number="settings.paddleSpeed">
			  			<option value=20>Slow</option>
			  			<option value=35>Standard</option>
			  			<option value=50>Fast</option>
					</select>
		  		</div>
		  		<div style="display: flex; justify-content: space-between;">
					<label for="ball-size">Ball Size:</label>
					<select id="ball-size" v-model.number="settings.ballSize">
			  			<option value=6>Small</option>
			  			<option value=10>Standard</option>
			  			<option value=20>Big</option>
					</select>
		  		</div>
				<div style="display: flex; justify-content: space-between;">
					<label for="ball-speed">Ball Speed:</label>
					<select id="ball-speed" v-model.number="settings.ballSpeed">
			  			<option value=3>Slow</option>
			  			<option value=5>Standard</option>
			  			<option value=10>Fast</option>
					</select>
		  		</div>
				<div style="display: flex; justify-content: space-between;">
					<label for="ball-speed-increase">Increase ball speed:</label>
					<select id="ball-speed-increase" v-model.number="settings.speedIncrease">
			  			<option value=0.3>True</option>
			  			<option value=0>False</option>
					</select>
		  		</div>
		  		<div style="display: flex; justify-content: space-between;">
					<label for="game-theme">Game Theme:</label>
					<select id="game-theme" v-model="settings.gameColor">
			  			<option value="white">Standard</option>
			  			<option value="green">Green</option>
			  			<option value="red">Red</option>
			  			<option value="yellow">Yellow</option>
			  			<option value=blue>Blue</option>
					</select>
		  		</div>
		  		<!-- <div> 
					<button @click='change_colors()'>Change Colors Randomly</button>
		  		</div> -->
		  		<div style="display: flex; justify-content: space-between;">
					<button @click='apply_changes()'>Validate</button>
					<button @click='reset_settings()'>Reset</button>
					<button @click='close_modal()'>Cancel</button>
		  		</div>
			</div>
	  	</template>
	</Modal>
</template>

<script setup lang="ts">
	import Modal from './../utils/Modal.vue'
	import { defineModel, defineProps, ref, defineEmits, reactive } from 'vue'
	import { useGameStore } from '@/stores/game';
	import GameSettingsDto from "../shared/game.interfaces";

	const show = defineModel('show', { required: true });
	const store = useGameStore();

	const settings: GameSettingsDto = reactive({
		winScore: 11,
		paddleSize: 80,
		paddleSpeed: 35,
		ballSize: 10,
		ballSpeed: 3,
		speedIncrease: 0.3,
		gameColor: 'white',
	});

	const emit = defineEmits(['settings']);

	function close_modal() {
		show.value = false;
	}

	function reset_settings() {
		settings.winScore = 11;
		settings.paddleSize = 80;
		settings.paddleSpeed = 35;
		settings.ballSize = 10;
		settings.ballSpeed = 3;
		settings.speedIncrease =  0.3;
		settings.gameColor = 'white';
//		store.inviteFriendsSettings(settings);
		close_modal();
	}

	function apply_changes() {
		emit('settings', settings);
		close_modal();
	}

</script>

<style scoped>

</style>
