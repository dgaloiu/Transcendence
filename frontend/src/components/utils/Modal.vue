<template>
	<div v-if:='props.show' class='modal-mask'>
		<div class='modal-wrapper'>
			<div class='modal-container'>
				<slot name="header"></slot>
				<slot name="content"></slot>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { defineProps } from 'vue'
	const props = defineProps({
		show: {
			type: Boolean,
			requiered: true,
			default: false,
		},
	});
</script>

<style scoped>
.modal-mask
{
	position: fixed;
	z-index: 9998;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(5px);
	display: table;
	transition: opacity 0.3s ease;
}

.modal-wrapper
{
	display: table-cell;
	vertical-align: middle;
}

.modal-container
{
	width: 300px;
	margin: 0px auto;
	padding: 20px 30px;
	background-color: #fff;
	border-radius: 2px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
	transition: all 0.3s ease;
	font-family: Helvetica, Arial, sans-serif;
	color: black;
}

</style>
