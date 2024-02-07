<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAppointmentStore, useUserStore } from '@/stores';
import { mapActions, mapWritableState } from 'pinia';
import BaseModal from '@/components/Modals/BaseModal.vue';
import { isAuthor } from '@/utils/usersAppointment.js';

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
            .then((response) => {
              if (response.status === 'Unauthorized' || !response.status) {
                failureCb(response.status);
              } else {
                successCb(this.activeAppointments.map((appointment) => ({
                      ...appointment,
                      start: appointment.eventDate,
                    })
                ))
              }
            })
            .catch(() => failureCb('Get appointments error')); // @todo implement better handler

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
    isAuthor,
    ...mapActions(useAppointmentStore, ['loadCurrentMonthAppointments', 'removeSelectedAppointment']),

    handleDateClick(arg) {
      // is it necessary???
      if (!this.user) {
        return;
      }

      this.eventData = arg;
      this.toggleModal();
    },

    onToggleModal(evt) {
      if (evt.status) {
        this.$refs.fullCalendar.calendar.refetchEvents();
      }

      this.toggleModal();
    },

    toggleModal() {
        this.isModalActive = !this.isModalActive;
    },

    async removeAppointment(appointmentId) {
      const { id } = await this.removeSelectedAppointment(appointmentId);

      // @todo handle else statement with the error notification
      if (id === appointmentId) {
        this.$refs.fullCalendar.calendar.refetchEvents();
      }
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
      <div class="group flex justify-start p-2 min-w-full bg-main-light hover:bg-main-dark text-white rounded-md">
        <button
          class="text-ellipsis overflow-hidden w-full"
          @click="handleDateClick(arg.event)"
        >
          {{ arg.event.title }}
        </button>
        <button
          v-if="isAuthor(arg.event.extendedProps.authorId)"
          class="pt-0 pr-1 pb-0.5 pl-0.5 text-transparent group-hover:text-white bg-transparent group-hover:bg-red-700 rounded-full w-6 h-6"
          @click="removeAppointment(arg.event.id)"
        >
          x
        </button>
      </div>
    </template>
  </full-calendar>
  <base-modal
    v-if="isModalActive"
    :event-data="eventData"
    @toggle-modal="onToggleModal"
  />
</template>