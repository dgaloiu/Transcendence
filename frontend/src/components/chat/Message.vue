<template>
	<div
		class='message border'
		:class="{ 'message-owner' : props.right }"
		@mouseenter='hover.message = true'
		@mouseleave='hover.message = false'
	>
		<div>
			<h3
				:class="{ 'hoverClickable' : !props.right }"
				@click.self="show_modal = true"
			>{{props.message.from.name}}</h3>
			<p style='word-break: break-all;'>{{props.message.message}}</p>
			<ModalUserRoom v-if='!props.right' v-model:show='show_modal' :message='props.message'/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import ModalUserRoom from './ModalUserRoom.vue'
	import { defineProps, ref, reactive, watch, computed, onMounted } from 'vue';

	const slide = ref();
	const animation = ref(undefined);
	const hover = reactive({
		message: false,
		slide: false,
	});
	const props = defineProps({
		message: {
			required: true,
		},
		right:Boolean,
	});

	const LeftOrRight = computed(() => props.right ? 'auto' : '0px');

	const show_modal = ref(false);

</script>

<style scoped>

.fill {
	position: absolute;
	top: 0px;
	left: 0px;
	height: 100%;
	width: 100%;
}

.display-button {
	margin-left: 100%;
	display:grid;
	grid-template-rows: 1fr 1fr 1fr;
}

.slide-button {
	z-index: -1;

	background-color: #121212;
	border-style: dashed;

	display: flex;
	justify-content: right;
}

.slide-button :hover {
	background-color: red;
}
.border {
	border-radius: 10px;
	border-width: 1px;
}

.message {
	padding: 2px 10px 5px;
	width: 40%;
	position: relative;
	background-color: var(--color-background);
	border-style: ridge;
}

.message > h3 {
	width: fit-content;
/*	font-size: x-small; */
}

.hoverClickable:hover {
	color: hsla(160, 100%, 37%, 1);
	cursor: default;
}

.message > p {
	color: antiquewhite;
}

.message-owner {
	margin-left: auto;
	background-color: darkslategray;
}
</style>
