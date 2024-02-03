export const routes = [
	{
		path: '/',
		name: 'home',
		component: () => import('@/pages/CalendarView.vue'),
	},
	{
		path: '/login',
		name: 'login',
		component: () => import('@/pages/Login.vue'),
		meta: {
			public: true,
		},
	},
	{
		path: '/signup',
		name: 'signup',
		component: () => import('@/pages/Signup.vue'),
		meta: {
			public: true,
		},
	},
	{
		path: '/restore-pwd',
		name: 'restore-pwd',
		component: () => import('@/pages/RestorePassword.vue'),
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'error-404',
		component: () => import('@/pages/Error404.vue'),
	}
];
