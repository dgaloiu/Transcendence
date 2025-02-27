<template>
	<Modal v-model:show='show'>
		<template v-slot:header>
			<h2> {{ props.message.from.name }} </h2>
		</template>
		<template v-slot:content>
			<div class='content'>
				<div>
					<button @click="addFriend()" :disabled="isFriend()">
						Add friend
					</button>
					<button @click="play()">
						Play
					</button>
					<button @click="privateMessage()">
						Private message
					</button>
					<button @click="blockUser()">
						Block User
					</button>

					<RouterLink style='white-space: nowrap;'
						:to="{
							name: 'profile',
							params: {
								id: props.message.from.id,
								name: props.message.from.name,
							},
						}">
						Go to Profile
					</RouterLink>
				</div>
				<div v-if="hasSupperiorRights()">
					<button @click="ban()">
						Ban
					</button>
					<button  @click="mute()">
						Mute
					</button>
					<button @click="kick()">
						Kick
					</button>
					<button @click="makeAdmin()">
						Make admin
					</button>
				</div>
				<button @click='close_modal()'>Close</button>
			</div>
			<ModalSettings v-model:show="show_modal_game_settings" @settings="inviteFriendToPlay"/>
		</template>
	</Modal>
</template>

<script setup lang="ts">
	import ModalSettings from '@/components/game/ModalSettings.vue';
	import Modal from './../utils/Modal.vue'

	import { onUpdated, defineModel, defineProps, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useChatStore } from '@/stores/chat'
	import { useUserStore } from '@/stores/user'

	const router = useRouter();
	const props = defineProps({
		message: {
			requiered: true,
		},
	});
	const show_modal_game_settings = ref(false);
	const show = defineModel('show', { required: true });
	function close_modal() { show.value = false }

	const chatStore = useChatStore();
	const userStore = useUserStore();

	function hasSupperiorRights() {
		const rights = chatStore.rights(props.message.to.id, props.message.from.id);
		return (rights);
	}

	import { usePopupStore } from '@/stores/popup'
	const popupStore = usePopupStore();
	function inviteFriendToPlay(settings) {
		const inviteGameDto = {
			opponentId: props.message.from.id,
			settings
		}
		userStore.inviteToPlay(inviteGameDto)
		popupStore.emit("Please wait for you opponent", "lmao", userStore.invitationCanceled);
	}

	function isFriend() {
		return (chatStore.isFriend(props.message.from.id));
	}

	async function addFriend() {
		await chatStore.addFriend(userStore.userId, props.message.from.id);
		close_modal();
	}

	async function blockUser() {
		await chatStore.blockUser(props.message.from.id);
		close_modal();
	}

	async function makeAdmin()
	{
		await chatStore.makeAdmin(props.message.from.id, props.message.to.id);
		close_modal();
	}

	async function play()
	{
		show_modal_game_settings.value = true;
//		await chatStore.play(props.message.from.id);
	}

	async function kick()
	{
		await chatStore.kick(props.message.from.id, props.message.to.id);
		close_modal();
	}

	async function mute()
	{
		await chatStore.mute(props.message.from.id, props.message.to.id);
		close_modal();
	}


	async function ban()
	{
		await chatStore.ban(props.message.from.id, props.message.to.id);
		close_modal();
	}

	async function privateMessage()
	{
		const response = await chatStore.privateMessage(props.message.from.id);
		const goToPath = {
			name: 'room',
			params: { id: response.roomId },
		};
		router.push(goToPath);
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
