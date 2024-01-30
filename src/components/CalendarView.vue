<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAppointmentStore, useUserStore } from '@/stores';
import { mapActions, mapWritableState } from 'pinia';
import BaseModal from '@/components/Modals/BaseModal.vue';

export default {
  name: 'CalendarView',

  components: {
    FullCalendar,
    BaseModal,
  },

  data() {
    return {
      basicCalendarOptions: {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        dateClick: this.handleDateClick,
        events: [],
      },
      eventData: {},
      isModalActive: false,
    }
  },

  async created() {
    this.basicCalendarOptions.events = this.activeAppointments
      .map((appointment) => {
      const appointmentDate = new Date(appointment.eventDate);

      return {
        ...appointment,
        date: `${appointmentDate.getFullYear()}-0${appointmentDate.getMonth()+1}-${appointmentDate.getDate()}`,
      };
    });
  },

  computed: {
    ...mapWritableState(useAppointmentStore, ['activeAppointments']),
    ...mapWritableState(useUserStore, ['user']),
  },

  methods: {
    ...mapActions(useUserStore, ['refreshToken']),

    handleDateClick(arg) {
      // is it necessary???
      if (!this.user) {
        return;
      }

      this.eventData = arg;

      this.toggleModal();
    },

    toggleModal() {
        this.isModalActive = !this.isModalActive;
    },
  },
}
</script>
<template>
  <full-calendar
    :options="basicCalendarOptions"
  >
    <template #eventContent="arg">
      <button
        class="flex justify-start p-2 min-w-full bg-main-light hover:bg-main-dark text-white rounded-md"
        @click="handleDateClick(arg.event)"
      >
        <span class="text-ellipsis overflow-hidden">
          {{ arg.event.title }}
        </span>
      </button>
    </template>
  </full-calendar>
  <base-modal
    v-if="isModalActive"
    :event-data="eventData"
    @toggle-modal="toggleModal"
  />
</template>