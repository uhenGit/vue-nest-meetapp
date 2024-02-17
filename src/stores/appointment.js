import { defineStore } from 'pinia';

export const useAppointmentStore = defineStore(
	'appointmentData',
	{
		state: () => ({
			loadedAppointments: new Map(),
			selectedPeriod: '',
		}),

		getters: {
			activeAppointments: (state) => {
				if (typeof state.loadedAppointments === 'undefined') {
					return [];
				}

				return state.loadedAppointments.get(state.selectedPeriod);
			},
			inactiveAppointments: [],
		},

		actions: {
			async addAppointment(appointment) {
				try {
					const { ok, error, statusText } = await fetch('http://localhost:3001/appointments/add-appointment', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
						},
						credentials: 'include',
						body: JSON.stringify(appointment),
					});

					return ok ? { status: ok } : { status: error || statusText };
				} catch (err) {
					throw new Error(`Create appointment error: ${JSON.stringify(err)}`);
				}
			},

			async loadCurrentMonthAppointments(period) {
				this.setSelectedPeriod(period);

				try {
					const url = `http://localhost:3001/appointments/load-appointments/${period.year}/${period.month}`;
					const response = await fetch(url, {
						method: 'GET',
						credentials: 'include',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`
						},
					});

					if (!response.ok) {
						return {
							status: response.error || response.statusText,
						};
					}

					const appointments = await response.json();
					this.loadedAppointments.set(this.selectedPeriod, appointments);

					return {
						status: response.ok,
					};
				} catch (err) {
					console.log('LOAD ERROR: ', err);
				}
			},

			async removeSelectedAppointment(appointmentId) {
				const url = `http://localhost:3001/appointments/remove/${appointmentId}`;
				try {
					const response = await fetch(url,{
						method: 'DELETE',
						credentials: 'include',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`
						},
					});
					const { id } = await response.json();

					return { id, status: 'removed' };
				} catch (err) {
					console.log('REMOVE ERROR: ', err);
				}
			},

			async updateAppointment(changes) {
				const url = 'http://localhost:3001/appointments/update-one';
				try {
					delete changes.author;
					delete changes.authorEmail;
					const response = await fetch(url, {
						method: 'PUT',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
							'Content-Type': 'application/json',
						},
						credentials: 'include',
						body: JSON.stringify(changes),
					});

					// @todo check status usage here
					return { status: response.ok };
				} catch (err) {
					console.error('UPDATE ERROR: ', err);
				}
			},

			async handleCancellation(appointmentId) {
				const url = `http://localhost:3001/appointments/toggle-cancel/${appointmentId}`;
				try {
					const response = await fetch(url, {
						method: 'PATCH',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
						},
						credentials: 'include',
					});
					const result = await response.json();

					return result.success ? { status: 'updated' } : {  status: response.error || result.errorStatus };
				} catch (err) {
					console.log('CANCELLATION ERROR: ', err);
				}
			},

			dropLoadedAppointments() {
				this.loadedAppointments.clear();
			},

			setSelectedPeriod(period) {
				this.selectedPeriod = `${period.month}/${period.year}`;
			},
		},
	}
)