<template>
	<main class='room-view'>
		<RoomList :rooms='rooms'/>
		<RouterView :key="$route.fullPath"/>
		<FriendList :friends="friends"/>
	</main>
</template>

<script setup lang="ts">
	import RoomList from '@/components/room/RoomList.vue'
	import FriendList from '@/components/room/FriendList.vue'

	import { ref, onMounted, onUnmounted } from 'vue'
	import { RouterLink, RouterView } from 'vue-router'
	import { storeToRefs } from 'pinia'

	import { useChatStore } from '@/stores/chat'
	const {
		rooms,
		friends,
	} = storeToRefs(useChatStore());

	import { useUserStore } from '@/stores/user'
	const userStore = useUserStore();
	onMounted(() => {
		userStore.emitters.isTalking();
	});
	onUnmounted(() => {
		userStore.emitters.quitTalking()
	});
</script>

<style>

.room-view {
	display:flex;
	flex-direction: row;
	gap: 20px;
}

</style>
