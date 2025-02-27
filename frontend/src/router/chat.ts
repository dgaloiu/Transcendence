import { useUserStore } from '@/stores/user'
import RoomView from '../views/RoomView.vue'

export const ChatRouter = {
	path: '/chat',
	name: 'chat',
	component: () => import('../views/ChatView.vue'),
	beforeEnter(to, from, next)
	{
		const userStore = useUserStore();
		if (userStore.signed)
			next();
	},
	children: [
		{
			path: '',
			name: 'defaultRoomView',
			component: () => import('../views/DefaultRoomView.vue')
		},
		{
			path: '/chat/:id',
			name: 'room',
			component: RoomView,
			props: true,
		}
	],
};
