<template>
	<Modal v-model:show='show'>
		<template v-slot:header>
			<h2>2FA Register</h2>
		</template>
		<template v-slot:content>
			<img v-if='!userStore.doubleAuth' style='margin:20px;' :src="qrCode" ></img>
			<form style='display:flex;' @submit.prevent="onSubmit" >
				<input maxlength="6" v-model="code" type="text" name="code" pattern="[0-9]{6}" required>
				<input type="submit" value="Envoyer" />
			</form>
			<p v-if='error'>Wrong code</p>
			<button @click='close_modal()'>Close</button>
		</template>
	</Modal>
</template>

<script setup lang="ts">
	import Modal from '@/components/utils/Modal.vue'
	import { ref, onBeforeMount } from 'vue'
	import { useUserStore } from '@/stores/user'

	const userStore = useUserStore();
	const qrCode = ref('');
	const code = ref(undefined);

	const show = defineModel('show', { required: true });
	function close_modal() { show.value = false }
	onBeforeMount(async () => {
		qrCode.value = await userStore.TwoFactor.QrCode();
	});

	const error = ref(false);
	async function onSubmit() {
		if (userStore.doubleAuth) {
			error.value = !await userStore.TwoFactor.TurnOff(code.value);
		} else {
			error.value = !await userStore.TwoFactor.Submit(code.value);
		}

		if (error.value === false)
			close_modal();
	}

</script>

<style>
.register {
	display: grid;
	grid-template-rows: 60px 1fr 30px;
}


input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
