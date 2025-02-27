<template>
	<header>
		<nav>
			<div>
				<RouterLink to="/">Home</RouterLink>
			</div>
			<div style='margin-left:auto'>
				<div v-if="userStore.user.signed" >
					<RouterLink to="/leader-board">Leader Board</RouterLink>
					<RouterLink :to='{
							name: "game",
							params: {
								launch: false
							}
						}'>Game</RouterLink>
					<RouterLink to="/chat">Chat</RouterLink>
					<RouterLink :to='{
						name: "profile",
						params: {
							id: userStore.user.id,
							name: userStore.user.name,
						}
					}'>Profile</RouterLink>
					<a class='cursor' @click='logout()'>Logout</a>
				</div>
				<RouterLink v-else to="/login">Login</RouterLink>
			</div>
		</nav>
	</header>
	<RouterView :key="$route.fullPath" class='router-view'/>
	<ModalPopup />
	<ModalAcceptInvitation />
</template>

<script setup lang="ts">
	import ModalAcceptInvitation from '@/components/chat/ModalAcceptInvitation.vue';
	import ModalPopup from '@/components/popup/ModalPopup.vue'
	import { ref } from 'vue'
	import { useRouter, RouterLink, RouterView } from 'vue-router'
	import { useUserStore } from '@/stores/user'

	const router = useRouter();
	const userStore = useUserStore();

	async function logout() {
		await userStore.logout();
		router.push({ path: '/', replace:true })
	}

</script>


<style scoped>
header {
	max-height: 50px;
	padding: 15px 0;
}

nav {
	display: grid;
	grid-template-columns: 1fr 1fr;
}

.cursor {
	cursor: pointer;
}

.router-view {
	flex-grow:1;
}

:any-link {
	cursor: pointer;
}
</style>
