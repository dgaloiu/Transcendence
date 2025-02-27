
<template>
	<div id='rooms-list'>
		<h2>Rooms</h2>
		<div>
			<div class="list">
				<h3>Public</h3>
				<template v-for="room in props.rooms">
					<RouterLink
						v-if="room.type == 'PUBLIC'"
						:to="{
							name: 'room',
							params: { id: room.id },
						}">
						{{ room.name }}
					</RouterLink>
				</template>
			</div>
			<div class="list">
				<h3>Protected</h3>
				<template v-for="room in props.rooms">
					<RouterLink
						v-if="room.type == 'PROTECTED'"
						:to="{
							name: 'room',
							params: { id: room.id },
						}">
						{{ room.name }}
					</RouterLink>
				</template>
			</div>
			<div class="list">
				<h3>Private</h3>
				<template v-for="room in props.rooms">
					<RouterLink
						v-if="room.type == 'PRIVATE'"
						:to="{
							name: 'room',
							params: { id: room.id },
						}">
						{{ room.name }}
					</RouterLink>
				</template>
			</div>
		</div>
		<div>
			<button @click="show_modal = true">New channel</button>
			<ModalRoomCreate v-model:show='show_modal'/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { RouterLink } from 'vue-router'
	import ModalRoomCreate from './ModalRoomCreate.vue'

	const props = defineProps({
		rooms: {
			type: Array,
			requiered: true,
		},
	});
	const show_modal = ref(false);
</script>

<style>

.list {
	display:flex;
	flex-direction: column;
}

#rooms-list
{
	display: grid;
	grid-template-rows: 36px 1fr 36px;
}

#rooms-list > div {
	display:grid;
	grid-auto-rows: min-content;
}

</style>
