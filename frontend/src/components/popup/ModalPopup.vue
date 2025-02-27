<template>
	<Modal v-model:show='popupStore.show'>
		<template v-slot:header>
			<h2>{{popupStore.content.title}}</h2>
		</template>
		<template v-slot:content>
			<div class='content'>
				<p>{{popupStore.content.content}}</p>
				<button @click='popupStore.closed()'>Close</button>
			</div>
		</template>
	</Modal>
</template>

<script setup lang="ts">
	import Modal from '@/components/utils/Modal.vue'
	import { usePopupStore } from '@/stores/popup'
	import { ref } from 'vue'

	const popupStore = usePopupStore();
</script>

<style scoped>
.content {
	display: flex;
	flex-direction: column;
}
</style>
