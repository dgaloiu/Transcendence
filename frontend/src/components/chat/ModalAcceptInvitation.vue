<template>
	<Modal v-model:show='userStore.showInvitation'>
		<template v-slot:header>
			<h2>{{userStore.player.name}} want to play</h2>
		</template>
		<template v-slot:content>
			<div class='content'>
				<button @click='accept()'>Accept</button>
				<button @click='close()'>Close</button>
			</div>
		</template>
	</Modal>
</template>

<script setup lang="ts">
	import Modal from '@/components/utils/Modal.vue'
	import { useUserStore } from '@/stores/user'
	import { ref } from 'vue'

	const userStore = useUserStore();
	function accept() {
		userStore.invitationResponse(true);
		userStore.closeInvitation();
	}

	function close() {
		userStore.invitationResponse(false);
		userStore.closeInvitation();
	}
</script>

<style scoped>
.content {
	display: flex;
	flex-direction: column;
}
</style>
