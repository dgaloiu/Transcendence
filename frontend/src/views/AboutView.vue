<template>
	<main class="about">
		<h1>Leader Board</h1>
			<div v-for="l in list" style='display:flex;'>
				<RouterLink
					:to="{
						name: 'profile',
						params: {
							id: l.id,
							name: l.name,
						},
					}">
					{{ l.name }}
				</RouterLink>
				{{ l.gameWon }} /
				{{ l.gameLost }}
			</div>
	</main>
</template>

<script setup lang="ts">
	import { ref, onMounted } from 'vue'
	import { useRouter, RouterLink, RouterView } from 'vue-router'
	import { useUserStore } from '@/stores/user'

	const router = useRouter();
	const userStore = useUserStore();
	const list = ref([]);

	onMounted(async () => {
		list.value = await userStore.getLeaderBoard();
	});

</script>

<style>
.about {
	display: flex;
	flex-direction: column;
	align-items: center;
}
</style>
