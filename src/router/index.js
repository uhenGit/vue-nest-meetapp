import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/stores';
import { routes } from '@/router/routes.js';

	const router = createRouter({
		history: createWebHashHistory(),
		routes,
	});

	router.beforeEach((to, from, next) => {
		const userStore = useUserStore();
		const isLoggedIn = userStore.isLoggedIn;
		console.log('storage: ', isLoggedIn, localStorage.getItem('users_token'))
		/* if (to.name === 'home' && localStorage.getItem('users_token')) {
			next();
			return;
		} */

		if (isLoggedIn && !to.meta.public && to.name !== 'home') {
			return next({ name: 'home' });
		}

		if (!isLoggedIn && !to.meta.public) {
			return next({
				name: 'login',
				query: { ...to.query, redirect: to.fullPath },
			})
		}

		return next();
	});

	export default router;
