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
						credentials: 'include',
						body: JSON.stringify(credentials),
					});
					const result = await response.json();

					if (response.status !== 201 || result.error) {
						this.userError = result.message;
						this.isLoggedIn = false;

						return;
					}

					this.user = result.user;
					this.access_token = result.accessToken;
					this.isLoggedIn = true;
					this.userError = null;
					localStorage.setItem('access_token', result.accessToken);
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
						credentials: 'include',
						body: JSON.stringify(credentials),
					});
					const result = await response.json();

					if (response.status !== 201 || result.error) {
						this.userError = result.message;
						this.isLoggedIn = true;

						return;
					}

					this.user = result.user;
					this.access_token = result.accessToken;
					this.isLoggedIn = true;
					this.userError = null;
					localStorage.setItem('access_token', this.access_token);
				} catch (err) {
					// notify about signup error
					this.userError = err.message;
					this.isLoggedIn = true;
				}
			},

			async logout() {
				try {
					await fetch('http://localhost:3001/auth/logout', {
						method: 'POST',
						credentials: 'include',
					});
					this.user = {};
					this.isLoggedIn = false;
					this.access_token = null;
					this.userError = null;
					localStorage.removeItem('access_token');
				} catch (err) {
					console.error('Logout error: ', err);
				}
			},

			async refreshToken() {
				try {
					// send cookies in the request or extract token from cookie and send like a body
					const response = await fetch('http://localhost:3001/auth/refresh', {
						method: 'POST',
						credentials: 'include',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`
						},
					});
					console.log('REFRESH response: ', response);
					const { accessToken, user } = await response.json();
					this.user = user;
					this.isLoggedIn = true;
					this.access_token = accessToken;
					this.userError = null;
					localStorage.setItem('access_token', accessToken);
				} catch (err) {
					console.error('Refresh token error: ', err);
				}
			}
		},
	}
)