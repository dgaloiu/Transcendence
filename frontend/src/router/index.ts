import { createRouter, createWebHistory, stringifyQuery } from 'vue-router'
import { useUserStore } from '@/stores/user'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'

import { ProfileRouter } from './profile.ts'
import { ChatRouter } from './chat.ts'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/404',
			component: () => import('../views/NotFoundView.vue')
		},
		{
			path: '/:pathMatch(.*)*',
			redirect: "/404"
		},
		{
			path: '/',
			name: 'home',
			component: HomeView
		},
		{
			path: '/leader-board',
			name: 'leaderBoard',
			component: () => import('../views/AboutView.vue')
		},
		{
			path: '/2fa',
			name: '2fa',
			component: () => import('../views/Profile/TwoFactor/Authentification.vue'),
			async beforeEnter(to, from, next)
			{
				const userStore = useUserStore();
				if (userStore.doubleAuth === false)
					next({path:'/', replace:true});
				else
					next();
			}
		},
		{
			path: "/login",
			name: "login",
			beforeEnter(to, from, next)
			{
				const link = new URL('https://api.intra.42.fr/oauth/authorize');
				const params = link.searchParams;
				params.append('client_id', import.meta.env.VITE_API_42_UID);
				params.append('redirect_uri', import.meta.env.VITE_API_42_REDIRECT);
				params.append('state', 'a_very_long_random_string_witchmust_be_unguessable');
				params.append('scope', 'public');
				params.append('response_type', 'code');
				window.location.href = link;
			},
		},
		{
			path: "/auth/login",
			name: "auth",
			async beforeEnter(to, from, next)
			{
				const userStore = useUserStore();
				await userStore.fetch42Access(to.query);
				if (userStore.doubleAuth)
					next({path:'/2fa', replace:true});
				else
					next({
						name:'profile',
						params: {
							id: userStore.user.id,
							name: userStore.user.name,
						},
						replace:true
					});
			},
		},
		{
			path: '/game?launch=:launch',
			name: 'game',
			component: GameView,
			props: true,
		},
		ProfileRouter,
		ChatRouter,
	]
})

export default router
