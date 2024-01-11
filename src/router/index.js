import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/stores';
import { routes } from '@/router/routes.js';

	const router = createRouter({
		history: createWebHashHistory(),
		routes,
	});

	router.beforeEach(async (to, from, next) => {
		const userStore = useUserStore();
		// const isLoggedIn = userStore.isLoggedIn || !!localStorage.getItem('access_token');
		console.log('storage: ', userStore.isLoggedIn, to.name);

		if (userStore.isLoggedIn && !to.meta.public && to.name !== 'home') {
			return next({ name: 'home' });
		}

		if (!userStore.isLoggedIn && !to.meta.public) {
			return next({
				name: 'login',
				query: { ...to.query, redirect: to.fullPath },
			})
		}

		// @todo check it twice
		/* if (to.name === 'home') {
			await userStore.refreshToken();

			if (userStore.isLoggedIn) {
				return next();
			}
			// add request to the 'refresh-token' route, and in case of success run next()
		} */

		return next();
	});

	export default router;
