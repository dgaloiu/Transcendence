<template>
	<Modal v-model:show='show'>
		<template v-slot:header>
			<h2>Invite</h2>
		</template>
		<template v-slot:content>
			<div class='content'>
				<a v-for="user in list" @click='invite(user.id)'>
					{{ user.name }}
				</a>
				<button @click='close_modal()'>Close</button>
			</div>
		</template>
	</Modal>
</template>

<script setup lang="ts">
	import Modal from './../utils/Modal.vue'

	import { onUpdated, defineModel, defineProps, ref } from 'vue'
	import { useChatStore } from '@/stores/chat'

	const chatStore = useChatStore();
	const props = defineProps({
		roomId: {
			requiered: true,
		},
	});
	const list = ref();

	onUpdated(async () => {
		list.value = await chatStore.usersNotInRoom(props.roomId);
	});

	const show = defineModel('show', { required: true });
	function close_modal() { show.value = false }

	function invite(userId:string)
	{
		chatStore.inviteUser(userId, props.roomId);
		close_modal();
	}

</script>

<style scoped>
.content
{
	display: flex;
	flex-direction: column;
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
