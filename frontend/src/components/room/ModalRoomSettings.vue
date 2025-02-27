<template>
	<Modal v-model:show='show'>
		<template v-slot:header>
			<h2>Room settings</h2>
		</template>
		<template v-slot:content>
			<div class='content'>
				<label>Room name</label>
				<input
					v-model='name'
					type='text'
					:placeholder='name'
				> </input>
				<button
					v-if='type !== "PROTECTED"' @click='addPassword = !addPassword'
				>Add password</button>
				<div v-if='type === "PROTECTED"'>
					<label>Password</label>
					<button
						@click='addPassword = !addPassword'
					>Change</button>
					<button
						@click='removePassword = !removePassword'
					>Remove</button>
				</div>
				<input
					v-model="password._old"
					v-if='(type === "PROTECTED" && addPassword) || removePassword'
					type='password'
					placeholder='Your old password'
				> </input>
				<div v-if='(type === "PROTECTED" && addPassword) || addPassword'>
					<input
						v-model="password._new"
						type='password'
						placeholder='Your new password'
					> </input>
					<input
						v-model="password._new2"
						type='password'
						placeholder='Your new password second time'
					> </input>
				</div>
				<button @click='submitChange()'>Submit change</button>
				<button @click='close_modal()'>Close</button>
			</div>
		</template>
	</Modal>
</template>

<script setup lang="ts">
	import Modal from './../utils/Modal.vue'

	import {
		onBeforeUpdate,
		onMounted,
		defineModel,
		defineProps,
		ref, reactive
	} from 'vue'
	import { useChatStore } from '@/stores/chat'
	const chatStore = useChatStore();

	import { usePopupStore } from '@/stores/popup'
	const popupStore = usePopupStore();

	const props = defineProps({
		id: {
			required: true,
		},
	});

	const password = reactive({
		_old: undefined,
		_new: undefined,
		_new2: undefined,
	});
	const name = ref(undefined);
	const type = ref<RoomType>(undefined);
	const addPassword = ref(true);
	const removePassword = ref(false);

	onMounted(async () => {
		const room:RoomDto = chatStore.getRoomById(props.id);
		if (room) {
			name.value = room.name;
			type.value = room.type;
		}
		if (type.value !== 'PROTECTED')
			addPassword.value = false;
	});

	onBeforeUpdate(() => {
		addPassword.value = false;
		removePassword.value = false;
		password._old = undefined;
		password._new = undefined;
		password._new2 = undefined;
	});

	async function submitChange() {
		if (addPassword.value && password._new !== password._new2) {
			popupStore.emit("The new password doesn't match", 'try again');
			return ;
		}
		var newType = type.value;
		if (type.value === 'PROTECTED' && removePassword.value)
			newType = 'PUBLIC';
		else if (type.value === 'PUBLIC' && addPassword.value)
			newType = 'PROTECTED';
		const newSettings = {
			id: props.id,
			name: name.value,
			type: newType,
			oldPassword: password._old,
			password: password._new,
		}
		const response = await chatStore.roomSettings(newSettings);
		if (response)
			close_modal();
	}

	const show = defineModel('show', { required: true });
	function close_modal() { show.value = false }

</script>

<style scoped>
.content {
	display: flex;
	flex-direction: column;
}

.content > input:nth-child(1) {
	grid-area: input;
}

.content > input:nth-child(2) {
	grid-area: type;
}

.content > input:nth-child(3) {
	grid-area: pass;
}

.content > button:nth-child(4) {
	grid-area: butt1;
}

.content > button:nth-child(5) {
	grid-area: butt2;
}
</style>
