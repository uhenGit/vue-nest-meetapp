<script>
import { mapState } from 'pinia';
import { getDateStr } from '@/utils/index.js';
import { useAppointmentStore } from '@/stores/index.js';

export default {
  name: 'DayAppointments',

  beforeRouteEnter(from, to, next) {
    next((vm) => {
      vm.selectedDay = from.params.selectedDay;
    });
  },

  data() {
    return {
      selectedDay: null,
    }
  },

  computed: {
    ...mapState(useAppointmentStore, ['activeAppointments']),

    selectedDayAppointments() {
      return this.activeAppointments.filter(({ eventDate }) => getDateStr(eventDate).date === this.selectedDay);
    },
  },
}
</script>
<template>
  <h2>Details</h2>
  <p>{{ selectedDay }}</p>
  <router-link :to="{ name: 'home' }">Back</router-link>
  <ul>
    <li
      v-for="appointment in selectedDayAppointments"
      :key="appointment.id"
    >
      {{ appointment.title }}
    </li>
  </ul>
</template>