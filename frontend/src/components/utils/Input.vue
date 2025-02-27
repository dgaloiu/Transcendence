
<template>
	<div id='inputWrapper'>
		<p v-if='props.label !== undefined'>{{ props.label }}</p>
		<div id='input'>
			<input v-model="input" type="text" :required="required" />
			<svg	class='svg'
					v-if='props.submit' @click="emit('submit')"
					xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
			>
				<path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z"/>
			</svg>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, defineProps, defineEmits } from 'vue'

	const emit = defineEmits(['submit'])

	const props = defineProps({
		required: {
			required: false,
			type: Boolean,
			default: false,
		},

		submit: {
			required: false,
			type: Boolean,
			default: false,
		},
		label: {
			required: false,
			type: String,
			default: undefined,
		}
	});

	const input = defineModel('input', {
		required: true,
		default: undefined,
	});

</script>

<style>

#inputWrapper {
	height: fit-content;
	display: flex;
	flex-direction: row;
	gap: 10px;
}

#inputWrapper > p {
	line-height: 32px;
}

#input {
	display: flex;
	flex-direction: row;
	gap: 10px;
	padding: 0 10px;
	height: 36px;
	border-radius: 18px;
	border-style: ridge;

	width:100%;
}

#input > input {
	background-color: transparent;
	color: antiquewhite;
	border-style:none;

	width:100%;
}

#input > input:focus {
	outline: none;
}

.button {
	background-color: transparent;
	height: 36px;
	line-height: 0px;
	border-style: none;
}

.svg {
	fill: antiquewhite;
	margin: auto 0;
	height: 25px;
}
</style>
