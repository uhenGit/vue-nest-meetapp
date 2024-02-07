<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAppointmentStore, useUserStore } from '@/stores';
import { mapActions, mapWritableState } from 'pinia';
import BaseModal from '@/components/Modals/BaseModal.vue';
import ContextMenu from '@/components/Modals/ContextMenu.vue';
import { isAuthor } from '@/utils/usersAppointment.js';

export default {
  name: 'CalendarView',

  components: {
    BaseModal,
    ContextMenu,
    FullCalendar,
  },

  data() {
    /* this.menuItems = [
      {
        name: 'Delete appointment',
        action: this.removeAppointment,
        disable: () => {
          const { authorId } = this.activeAppointments.find(({ id }) => id === this.selectedAppointmentId);
          return isAuthor(authorId);
        },
      },
      {
        name: 'Cancel appointment',
        action: this.cancelAppointment,
        disable: () => {
          const { authorId } = this.activeAppointments.find(({ id }) => id === this.selectedAppointmentId);
          return isAuthor(authorId);
        },
      },
    ]; */
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
      isShowMenu: false,
      menuCoords: {},
      selectedAppointmentId: null,
    }
  },

  beforeUnmount() {
    if (this.$refs.fullCalendar) {
      this.$refs.fullCalendar.calendar.destroy();
    }

    this.eventData = {};
    this.selectedAppointmentId = null;
  },

  computed: {
    ...mapWritableState(useAppointmentStore, ['activeAppointments']),
    ...mapWritableState(useUserStore, ['user']),

    menuItems() {
      return [
        {
          name: 'Delete appointment',
          action: this.removeAppointment,
          disable: () => {
            const { authorId } = this.activeAppointments.find(({ id }) => id === this.selectedAppointmentId);
            return isAuthor(authorId);
          },
        },
        {
          name: 'Cancel appointment',
          action: this.cancelAppointment,
          disable: () => {
            const { authorId } = this.activeAppointments.find(({ id }) => id === this.selectedAppointmentId);
            return isAuthor(authorId);
          },
        },
      ];
    },
  },

  methods: {
    ...mapActions(useAppointmentStore, ['loadCurrentMonthAppointments', 'removeSelectedAppointment']),

    handleDateClick(arg) {
      // is it necessary???
      if (!this.user) {
        return;
      }

      this.eventData = arg;
      console.log('CLICK: ', this.eventData);
      this.toggleModal();
    },

    onToggleModal(evt) {
      console.log('TOGGLE: ', evt);
      if (evt.status) {
        this.$refs.fullCalendar.calendar.refetchEvents();
      }

      this.toggleModal();
    },

    toggleModal() {
      this.isModalActive = !this.isModalActive;
    },

    async removeAppointment() {
      console.log('REMOVE: ', this.selectedAppointmentId);
      const { id } = await this.removeSelectedAppointment(this.selectedAppointmentId);

      // @todo handle else statement with the error notification
      if (id === this.selectedAppointmentId) {
        this.onShowMenu();
        this.$refs.fullCalendar.calendar.refetchEvents();
      }
    },

    async cancelAppointment() {
      console.log('CANCEL: ', this.selectedAppointmentId);
    },

    onShowMenu(evt, itemId) {
      if (this.isShowMenu && !itemId) {
        this.selectedAppointmentId = null;
        this.menuCoords = {};
      } else {
        this.selectedAppointmentId = itemId;
        this.menuCoords = { x: evt.x, y: evt.y };
      }
      console.log('Menu: ', this.menuCoords, this.selectedAppointmentId);

      this.isShowMenu = !this.isShowMenu;
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
          class="bg-white group-hover:bg-gray-300 text-gray-950 rounded-full w-6 h-6"
          @click.stop="onShowMenu($event, arg.event.id)"
        >
          ...
        </button>
      </div>
    </template>
  </full-calendar>
  <base-modal
    v-if="isModalActive"
    :event-data="eventData"
    @toggle-modal="onToggleModal"
  />
  <context-menu
      v-if="isShowMenu"
      :coords="menuCoords"
      @hide-menu="onShowMenu"
  >
    <template #menu-name>
      <p class="text-white text-md mb-2 px-3">Appointment's actions</p>
    </template>
    <template #menu-list>
      <ul>
        <li
            v-for="(item, idx) in menuItems"
            :key="idx"
            class="hover:bg-gray-700 cursor-pointer px-3 py-2 text-white text-sm rounded-b-md"
            :class="{ 'text-gray-500': item.disable }"
            @click="item.action"
        >
          {{ item.name }}
        </li>
      </ul>
    </template>
  </context-menu>
</template>