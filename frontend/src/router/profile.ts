import { useUserStore } from '@/stores/user'
import View from '@/views/Profile/View.vue'

export const ProfileRouter = {
	path: '/profile?id=:id&name=:name',
	name: 'profile',
	component: View,
	props: true,
	beforeEnter(to, from, next)
	{
		const userStore = useUserStore();
		if (userStore.user.signed === false)
			next({path:'/'})
		else
			next();
	},
};

