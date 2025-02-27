
<template>
	<main id='chat-view'>
		<div class='nav-bar'>
			<h2>Chat {{ name }}</h2>
			<InviteButton @click="invite()"/>
			<LeaveButton @click="leaveRoom(props.id)"/>
			<ParametreButton @click="show_modal_settings = true"/>
			<ModalInvite v-model:show="show_modal" :roomId="props.id"/>
			<ModalRoomSettings
				v-if='true'
				v-model:show="show_modal_settings"
				:id="props.id"
			/>
		</div>
		<div v-if="roomProtected">
			<form @submit.prevent="submitPassword" >
				<Input
					v-model:input='password'
					label='Password'
					submit
					required
					@submit='submitPassword()'
				/>
			</form>
		</div>
		<Chat v-else @submit='onSubmit'>
			<Message
				v-for="msg in chatStore.messages(props.id)"
				v-bind:message="msg"
				:right="msg.from.id == userStore.user.id"
			/>
		</Chat>
	</main>
</template>

<script setup lang="ts">

	import Input from '@/components/utils/Input.vue'
	import InviteButton from '@/components/utils/InviteButton.vue'
	import LeaveButton from '@/components/utils/LeaveButton.vue'
	import ParametreButton from '@/components/utils/ParametreButton.vue'
	import ModalInvite from '@/components/room/ModalInvite.vue'
	import ModalRoomSettings from '@/components/room/ModalRoomSettings.vue'
	import Chat from '@/components/chat/Chat.vue'
	import Message from '@/components/chat/Message.vue'

	import { RoomType, RoomDto } from '../shared/chat.interfaces'

	import { ref, defineProps, onMounted, computed } from 'vue'

	import { useUserStore } from '@/stores/user';
	const userStore = useUserStore();
	import { useChatStore } from '@/stores/chat'
	const chatStore = useChatStore();

	const props = defineProps({
		id: {
			type: String,
			required: true,
		},
	});
	const new_message = ref(undefined);
	const name = ref("");
	const type = ref<RoomType>('PUBLIC');
	const password = ref(undefined);

	const canAccess = ref(false);
	const roomProtected = computed(() => {
		return ((type.value === 'PROTECTED') && !canAccess.value);
	})

	function onSubmit(message:string) {
		chatStore.send_message(props.id, message);
	}

	async function submitPassword() {
		canAccess.value = await chatStore.join(props.id, password.value);
	}

	onMounted(async () => {
		const room:RoomDto = chatStore.getRoomById(props.id);
		if (room)
		{
			name.value = room.name;
			type.value = room.type;
		}
		if (type.value != 'PROTECTED')
			canAccess.value = await chatStore.join(props.id);
	});

	const show_modal = ref(false);
	const show_modal_settings = ref(false);
	function invite()
	{
		show_modal.value = true;
	}

	function leaveRoom(roomId:string) {
		chatStore.leaveRoom(roomId);
	}

</script>

<style>
.nav-bar {
	padding: 0px 30px;
	display: flex;
	flex-direction: row;
}

.nav-bar > h2 {
	margin-right: auto;
}

#chat-view {
	width: 100%;
	display: grid;
	grid-template-rows: 36px 1fr;
	grid-row-gap: 20px;
}

#chat-form {
	display: grid;
	grid-template-columns: 1fr 40px;
	grid-gap: 10px;
	margin: 0px 20px;
	padding-left:20px;
	height: 36px;
	border-radius: 18px;
	border-style: ridge;
}

.input {
	background-color: transparent;
	color: antiquewhite;
	border-style:none;
}

.input:focus {
  outline: none;
}

.button {
	background-color: transparent;
	height: 36px;
	line-height: 0px;
	border-style: none;
}
</style>
