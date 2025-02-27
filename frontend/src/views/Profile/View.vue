
<template>
	<main class='profile-view'>
		<div>
			<div id='avatar'>
				<h2>{{ props.name }}</h2>
				<div v-if='userStore.user.id === props.id'>
					<input v-model='newName' type="text"></input>
					<button @click='updateName()'>Change name</button>
				</div>
				<div id='img'>
					<img height='200px' width='200px' :src="avatar">
				</div>
				<form
					id='imgForm'
					method="post"
					enctype="multipart/form-data"
					@submit.prevent="userStore.submitAvatar"
					v-if='props.id === userStore.user.id'
				>
					<label for="file">File</label>
					<input
						id="file"
						name="file"
						type="file"
						accept="image/jpeg, image/png, image/jpg"
						@change="preview"
					/>
					<input type="submit" value="Envoyer" />
				</form>
			</div>
			<fieldset v-if='props.id === userStore.user.id'>
				<legend>Two factor Authentification</legend>
				<input type="checkbox" id="scales" name="scales" :checked="userStore.doubleAuth" @click.prevent="showModal = true" />
				<label style='margin-left: 20px;'for="scales">Activate</label>
				<RegisterView v-model:show='showModal'/>
			</fieldset>
		</div>
		<div>
			<h2>Game history</h2>
			<ol>
				<li v-for="game in history" style='display:flex;'>
					<p>	{{ game.won ? 'Win' : 'Loose' }}
						{{ game.won ? game.winnerScore : game.looserScore }} / {{ game.won ? game.looserScore : game.winnerScore }}
					</p>
					<RouterLink
						:to="{
							name: 'profile',
							params: {
								id: game.opponentId,
								name: game.opponent.name,
							},
						}">
						{{ game.opponent.name }}
					</RouterLink>
				</li>
			</ol>
		</div>
	</main>
</template>

<script setup lang="ts">
	import RegisterView from '@/views/Profile/TwoFactor/RegisterView.vue'
	import { ref, onMounted, watch } from 'vue'
	import { RouterLink, RouterView } from 'vue-router'

	const props = defineProps({
		id: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
	});
	import { useUserStore } from '@/stores/user'
	const userStore = useUserStore();

	const showModal = ref(false);
	const newName = ref(props.name);

	import { usePopupStore } from '@/stores/popup'
	const popupStore = usePopupStore();

	async function updateName() {
		if (await userStore.updateName(newName.value) === false)
			popupStore.emit('the name is already taken', 'lol');
	}

	const avatar = ref(undefined);
	function preview(event) {
		const [file] = event.target.files;
		if (file) {
			avatar.value = URL.createObjectURL(file)
		}
	}
	const history = ref([]);
	onMounted(async () => {
		avatar.value = await userStore.getAvatar(props.id);
		history.value = await userStore.getHistory(props.id);
	});

</script>

<style scope>
.profile-view {
	display:flex;
	gap:20px;
}

#avatar {
	display:flex;
	flex-direction: column;
	justify-content: center;
	max-width: 245px;
}

#imgForm {
	display: grid;
}

#img {
	width: 200px;
	height: 200px;
	display: flex;
	justify-content: center;
	margin: 0 auto;
}

#img > img {
object-fit: cover;
}
</style>
