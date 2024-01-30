import { defineStore } from 'pinia';

export const useAppointmentStore = defineStore(
	'appointmentData',
	{
		state: () => ({
			loadedAppointments: new Map(),
			selectedPeriod: '',
			loadError: null,
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
						this.loadError = response.error;
						return;
					}

					const newAppointment = await response.json();
					this.injectAppointment(newAppointment);
				} catch (err) {
					throw new Error(`Create appointment error: ${JSON.stringify(err)}`);
				}
			},

			async loadCurrentMonthAppointments(period) {
				this.setSelectedPeriod(period);

				if (this.selectedPeriod in this.loadedAppointments) {
					return;
				}

				try {
					const url = `http://localhost:3001/appointments/load-appointments/${period.year}/${period.month}`
					const response = await fetch(url, {
						method: 'GET',
						credentials: 'include',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`
						},
					});

					if (!response.ok) {
						this.loadError = response.error;
						return;
					}

					const appointments = await response.json()
					this.loadedAppointments.set(this.selectedPeriod, appointments);
					// load appointments each time when user adds a month to the 'loadedMonths' array
				} catch (err) {
					console.log('LOAD ERROR: ', err);
				}
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