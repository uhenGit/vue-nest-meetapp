import { defineStore } from 'pinia';

export const useUserStore = defineStore(
	'userData',
	{
		state: () => ({
			user: {},
			isLoggedIn: false,
			access_token: null,
			userError: null,
		}),
		getters: {},
		actions: {
			async login(credentials) {
				try {
					const response = await fetch('http://localhost:3001/auth/signin', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(credentials),
					});
					const result = await response.json();

					if (result.error || result.statusCode !== 200) {
						this.userError = result.message;
						this.isLoggedIn = false;

						return;
					}

					this.user = result.user;
					this.access_token = result.access_token;
					this.isLoggedIn = true;
					this.userError = null;
					// localStorage.setItem('users_token', this.access_token);
				} catch (err) {
					// notify about error
					this.userError = err.message;
					this.isLoggedIn = false;
				}
			},

			async signup(credentials) {
				try {
					const response = await fetch('http://localhost:3001/auth/signup', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(credentials),
					});
					const result = await response.json();

					if (result.error || result.statusCode !== 200) {
						this.userError = result.message;
						this.isLoggedIn = false;

						return;
					}

					this.user = result.user;
					this.access_token = result.access_token;
					this.isLoggedIn = true;
					this.userError = null;
					// localStorage.setItem('users_token', this.access_token);
				} catch (err) {
					// notify about signup error
					this.userError = err.message;
					this.isLoggedIn = false;
				}
			},

			logout() {
				this.user = {};
				this.isLoggedIn = false;
				this.access_token = null;
				this.userError = null;
				localStorage.removeItem('users_token');
			},
		},
	}
)