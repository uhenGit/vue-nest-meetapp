import { defineStore } from 'pinia';

export const useAppointmentStore = defineStore(
	'appointmentData',
	{
		state: () => ({
			loadedAppointments: [],
			usedMonths: [],
		}),

		getters: {
			loadedMonths: ({ usedMonths }) => usedMonths,
			activeAppointments: [],
			inactiveAppointments: [],
		},

		actions: {
			async addAppointment(data, users_token) {
				// add appointment to the DB using the user email
				const response = await fetch('http://localhost:3001/appointments/add-appointment', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ data, users_token }),
				});
				console.log('ADD appointment: ', response);
			},

			addMonthToUsedList(month) {
				this.usedMonths.push(month);
			},

			async loadCurrentMonthAppointments() {
				const response = await fetch('http://localhost:3001/appointments/load-appointments/:feb');
				console.log('LOAD appointments: ', response);
				// load appointments each time when user adds a month to the 'loadedMonths' array
			},
		},
	}
)