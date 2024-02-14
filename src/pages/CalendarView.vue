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
      menuPosition: {},
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
          disable: this.disabled,
          action: this.disabled ? null : this.removeAppointment,
        },
        {
          name: 'Cancel appointment',
          disable: this.disabled,
          action: this.disabled ? null : this.toggleUsersCancellation,
        },
        {
          name: 'View/edit details',
          action: () => {
            const selectedAppointment = this.activeAppointments.find(({ id }) => id === this.selectedAppointmentId);
            this.handleDateClick({
              extendedProps: { ...selectedAppointment },
              title: selectedAppointment.title,
              id: selectedAppointment.id,
            });
          }
        },
      ];
    },

    disabled() {
      if (!this.selectedAppointmentId || !this.activeAppointments) {
        return false;
      }

      const { authorId } = this.activeAppointments.find(({ id }) => id === this.selectedAppointmentId);
      return !isAuthor(authorId);
    },
  },

  methods: {
    ...mapActions(useAppointmentStore, [
      'loadCurrentMonthAppointments',
      'removeSelectedAppointment',
      'handleCancellation',
    ]),

    handleDateClick(arg) {
      if (this.isShowMenu) {
        this.hideMenu();
        return;
      }

      this.eventData = arg;
      this.selectedAppointmentId = arg.id;
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

    async removeAppointment() {
      const { id } = await this.removeSelectedAppointment(this.selectedAppointmentId);
      this.hideMenu();
      this.isModalActive = false;
      this.selectedAppointmentId = null;

      // @todo handle else statement with the error notification
      if (id === this.selectedAppointmentId) {
        this.$refs.fullCalendar.calendar.refetchEvents();
      }
    },

    async toggleUsersCancellation() {
      const { status } = await this.handleCancellation(this.selectedAppointmentId);
      console.log('CANCEL: ', status, this.selectedAppointmentId);
      this.hideMenu();
      this.isModalActive = false;
      this.selectedAppointmentId = null;

      if (status === 'updated') {
        this.$refs.fullCalendar.calendar.refetchEvents();
      }

    },

    showMenu(evt, itemId) {
      this.menuPosition = this.setPosition(evt);
      this.selectedAppointmentId = itemId;
      this.isShowMenu = true;
    },

    hideMenu() {
      this.selectedAppointmentId = null;
      this.menuPosition = {
        maxHeight: null,
      };
      this.isShowMenu = false;
    },

    setPosition(event) {
      const coords = {
        left: `${event.x}px`,
        top: `${event.y}px`,
      };
      const documentWidth = document.documentElement.clientWidth;
      const documentHeight = document.documentElement.clientHeight;
      if ((event.x + 200) > documentWidth) {
        coords.left = `${event.x - (200 - (documentWidth - event.x))}px`;
      }
      if ((event.y + 150) > documentHeight) {
        coords.maxHeight = '150px';
      }
      return coords;
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
      <div class="group flex justify-start pr-2 min-w-full bg-main-light text-white rounded-md">
        <button
          class="text-ellipsis pl-1.5 overflow-hidden w-full group-hover:bg-main-dark rounded-l-md"
          role="switch"
          @click="handleDateClick(arg.event)"
        >
          {{ arg.event.title }}
        </button>
        <button
          class="bg-white ml-2 my-2 group-hover:bg-gray-300 text-gray-950 rounded-full w-4 h-4 relative"
          @click.stop="showMenu($event, arg.event.id)"
        >
          <svg
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            fill="#3d3846"
            class="w-4 h-4"
          >
            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
          </svg>
        </button>
      </div>
    </template>
  </full-calendar>
  <base-modal
    v-if="isModalActive"
    :event-data="eventData"
    @toggle-modal="onToggleModal"
    @remove-appointment="removeAppointment"
  />
  <context-menu
      v-if="isShowMenu"
      :menu-position="menuPosition"
      @hide-menu="hideMenu"
  >
    <template #menu-name>
      <p
        class="text-white text-md mb-2 px-3"
        role="menubar"
      >
        Appointment's actions
      </p>
    </template>
    <template #menu-list>
      <ul>
        <li
            v-for="(item, idx) in menuItems"
            :key="idx"
            class="hover:bg-gray-700 px-3 py-2 text-sm rounded-b-md"
            :class="[ item.disable ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer text-red-300' ]"
            role="menuitem"
            @click="item.action"
        >
          {{ item.name }}
        </li>
      </ul>
    </template>
  </context-menu>
</template>