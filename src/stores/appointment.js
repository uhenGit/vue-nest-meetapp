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
					return {};
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
					// @todo check it twice
					this.injectAppointment(newAppointment);

					return {
						status: response.statusText,
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
					// load appointments each time when user adds a month to the 'loadedMonths' array
					return {
						status: response.statusText,
					};
				} catch (err) {
					console.log('LOAD ERROR: ', err);
				}
			},

			dropLoadedAppointments() {
				this.loadedAppointments.clear();
			},

			setSelectedPeriod(period) {
				this.selectedPeriod = `${period.month}/${period.year}`;
			},

			injectAppointment(item) {
				const currentPeriodAppointments = this.loadedAppointments.get(this.selectedPeriod);
				currentPeriodAppointments.push(item);
				this.loadedAppointments.set(this.selectedPeriod, currentPeriodAppointments);
			},
		},
	}
)