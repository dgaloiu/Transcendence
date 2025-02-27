<template>
	<div id='chat'>
		<div class='message-list-overflow'>
			<div ref='messagesNode' class='messages-list'>
				<slot></slot>
			</div>
		</div>
		<form @submit.prevent="submit">
			<Input width='100%'
				v-model:input='new_message'
				submit
				required
				@submit='submit()'
			/>
		</form>
	</div>
</template>

<script setup lang="ts">
	import Input from '@/components/utils/Input.vue'

	import {
		ref,
		defineProps, defineEmits,
		onUpdated, onMounted,
	} from 'vue'
	const new_message = ref(undefined);

	const emit = defineEmits(['submit'])
	function submit()
	{
		emit('submit', new_message.value);
		new_message.value = undefined;
	}

	const messagesNode = ref(undefined);

	onMounted (() => {
		messagesNode.value.lastElementChild?.scrollIntoView({behavior: 'smooth'});
	});

	onUpdated (() => {
		messagesNode.value.lastElementChild?.scrollIntoView({behavior: 'smooth'});
	});
</script>

<style>
#chat {
	display: flex;
	flex-direction: column;
	gap:20px;
	height:100%;
}

.message-list-overflow {
	position: relative;
	height: 100%;
	width: 100%;
}

.messages-list {
	position: absolute;
	overflow-y: auto;

	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 0px 30px;
}
</style>
