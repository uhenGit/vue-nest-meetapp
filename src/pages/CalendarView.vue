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
        events: (info, successCb, failureCb) => {
          const period = {
            year: info.start.getFullYear(),
            month: info.start.getMonth() + 1,
          };
          this.loadCurrentMonthAppointments(period)
            .then(({ status }) => {
              if (status === 'OK') {
                successCb(this.activeAppointments.map((appointment) => ({
                      ...appointment,
                      start: appointment.eventDate,
                    })
                ))
              } else {
                failureCb(status);
              }
            })
            .catch((err) => failureCb(err));

        },
        showNonCurrentDates: false,
      },
      eventData: {},
      isModalActive: false,
    }
  },

  beforeUnmount() {
    if (this.$refs.fullCalendar) {
      this.$refs.fullCalendar.calendar.destroy();
    }
  },

  computed: {
    ...mapWritableState(useAppointmentStore, ['activeAppointments']),
    ...mapWritableState(useUserStore, ['user']),
  },

  methods: {
    ...mapActions(useAppointmentStore, ['loadCurrentMonthAppointments']),

    handleDateClick(arg) {
      // is it necessary???
      if (!this.user) {
        return;
      }

      this.eventData = arg;
      this.toggleModal();
    },

    onToggleModal(evt) {
      if (evt.status === 'Created') {
        this.$refs.fullCalendar.calendar.refetchEvents();
      }

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
    ref="fullCalendar"
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
    @toggle-modal="onToggleModal"
  />
</template>