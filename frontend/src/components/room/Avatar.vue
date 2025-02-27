<template>
	<div class='avatar'>
		<RouterLink
			:to="{
				name: 'room',
				params: { id: props.avatar.roomId },
			}">
			{{props.avatar.name}}
		</RouterLink>
		<account v-if='props.avatar.isConnected'/>
		<account-off v-else/>
		<account-voice v-if='props.avatar.isTalking' />
		<cards-playing v-if='props.avatar.isPlaying' />
	</div>
</template>

<script setup lang="ts">
	import Account from 'vue-material-design-icons/Account.vue';
	import AccountOff from 'vue-material-design-icons/AccountOff.vue';
	import AccountVoice from 'vue-material-design-icons/AccountVoice.vue';
	import CardsPlaying from 'vue-material-design-icons/CardsPlaying.vue';

	const props = defineProps({
		avatar: {
			required: true,
		},
	});

</script>

<style scoped>

.avatar {
	display: flex;
}

.avatar > a {
	cursor: pointer;
	white-space: nowrap;
}

</style>
