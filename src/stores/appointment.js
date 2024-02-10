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
					const response = await fetch('http://localhost:3001/appointments/add-appointment', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
						},
						credentials: 'include',
						body: JSON.stringify(appointment),
					});

					if (!response.ok) {
						return {
							status: response.error || response.statusText,
						};
					}

					const newAppointment = await response.json();
					this.injectAppointment(newAppointment);

					return {
						status: response.ok,
					}
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
					this.pickAppointment(id);

					return { id, status: response.ok };
				} catch (err) {
					console.log('REMOVE ERROR: ', err);
				}
			},

			async updateAppointment(changes) {
				const url = 'http://localhost:3001/appointments/update-one';
				try {
					const response = await fetch(url, {
						method: 'PUT',
						credentials: 'include',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
						},
						body: JSON.stringify(changes),
					});
					console.log('UPDATE response: ', response);
					const updatedAppointment = await response.json();
					console.log('UPDATE result: ', updatedAppointment);
					// @todo inject updated appointment
				} catch (err) {
					console.error('UPDATE ERROR: ', err);
				}
			},

			dropLoadedAppointments() {
				this.loadedAppointments.clear();
			},

			setSelectedPeriod(period) {
				this.selectedPeriod = `${period.month}/${period.year}`;
			},

			injectAppointment(item) {
				const currentPeriodAppointments = this.activeAppointments.concat[item];
				this.loadedAppointments.set(this.selectedPeriod, currentPeriodAppointments);
			},

			pickAppointment(appointmentId) {
				const currentPeriodAppointments = this.activeAppointments.filter(({ id }) => id !== appointmentId);
				this.loadedAppointments.set(this.selectedPeriod, currentPeriodAppointments);
			},
		},
	}
)