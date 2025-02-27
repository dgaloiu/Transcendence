<template>
	<Modal v-model:show='show'>
		<template v-slot:header>
			<h2>Create a new channel</h2>
		</template>
		<template v-slot:content>
			<div class='content'>
				<input type="text" v-model='channel.name' required/>
				<select v-model="channel.type">
					<option value="PUBLIC">Public</option>
					<option value="PRIVATE">Private</option>
					<option value="PROTECTED">Protected</option>
				</select>
				<input v-if="channel.type === 'PROTECTED'" type="text" v-model='channel.password' required/>
				<button @click='close_modal()'>Close</button>
				<button @click='create_room()' :disabled='channel.name === ""'>Create</button>
			</div>
		</template>
	</Modal>
</template>

<script setup lang="ts">
	import Modal from './../utils/Modal.vue'

	import { defineModel, ref, toRaw } from 'vue'
	import { useChatStore } from '@/stores/chat'
	import type { CreateRoomDTO } from '@/shared/chat.interfaces.ts'

	const chatStore = useChatStore();
	const channel:CreateRoomDTO = ref({
		name: '',
		type: 'PUBLIC',
	});

	const show = defineModel('show', { required: true });
	function close_modal()
	{
		show.value = false;
		channel.name = '';
	}

	function create_room()
	{
		if (chatStore.createRoom(toRaw(channel.value)))
			close_modal();
	}

</script>

<style scoped>
.content
{
	display: grid;
	grid-template-areas:
		"input input input"
		"type type type"
		"pass pass pass"
		"butt1 none_ butt2";
	gap: 10px 20px;
}

.content > input:nth-child(1)
{
	grid-area: input;
}

.content > input:nth-child(2)
{
	grid-area: type;
}

.content > input:nth-child(3)
{
	grid-area: pass;
}

.content > button:nth-child(4)
{
	grid-area: butt1;
}
.content > button:nth-child(5)
{
	grid-area: butt2;
}
</style>
