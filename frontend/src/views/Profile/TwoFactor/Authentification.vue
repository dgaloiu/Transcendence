<template>
	<div class="register">
		<h1>2FA Authentification</h1>
		<form @submit.prevent="onSubmit" >
			<input v-model="code" type="text" name="code" pattern="[0-9]{6}" required>
			<input type="submit" value="Envoyer" />
		</form>
	</div>
</template>

<script setup lang="ts">
	import { ref, onBeforeMount } from 'vue'
	import { useRouter } from 'vue-router'

	import { useUserStore } from '@/stores/user'
	const userStore = useUserStore();

	const code = ref(undefined);
	const router = useRouter();

	async function onSubmit() {
		if (await userStore.TwoFactor.Authenticate(code.value))
			router.push({ name: 'profile', params: {
				id: userStore.user.id,
				name: userStore.user.name,
			}, replace: true })
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
