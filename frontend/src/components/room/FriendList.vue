
<template>
	<div>
		<h2>P2P</h2>
		<div>
			<div>
				<h3>Friends</h3>
				<template v-for="friend in props.friends">
					<Avatar v-if='friend.friendship' v-bind:avatar="friend" />
				</template>
			</div>
			<div>
				<h3>Private Message</h3>
				<template v-for="friend in props.friends">
					<Avatar v-if='!friend.friendship' v-bind:avatar="friend" />
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import Avatar from './Avatar.vue'
	import { defineProps } from 'vue'
	const props = defineProps({
		friends: {
			type: Array,
			required: true,
		},
	});
</script>

<style scoped>
h3 {
	white-space: nowrap;
}
</style>
