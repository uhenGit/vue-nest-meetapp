<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAppointmentStore, useUserStore } from '@/stores';
import { mapActions, mapWritableState } from 'pinia';
import BaseModal from '@/components/Modals/BaseModal.vue';
import ContextMenu from '@/components/Modals/ContextMenu.vue';
import MenuButton from '@/components/UI/MenuButton.vue';
import { isAuthor } from '@/utils/usersAppointment.js';

export default {
  name: 'CalendarView',

  components: {
    BaseModal,
    ContextMenu,
    FullCalendar,
    MenuButton,
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
      eventDay: null,
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
          name: 'Duplicate appointment',
          disable: false,
          action: this.onDuplicateAppointment,
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

      const { authorId } = this.eventData;
      return !isAuthor(authorId);
    },

    eventData() {
      if (!this.selectedAppointmentId) {
        return {};
      }

      return this.activeAppointments.find(({ id }) => id === this.selectedAppointmentId);
    },
  },

  methods: {
    ...mapActions(useAppointmentStore, [
      'loadCurrentMonthAppointments',
      'removeSelectedAppointment',
      'handleCancellation',
      'addAppointment',
    ]),

    handleDateClick(arg) {
      this.hideMenu();
      this.eventDay = arg.dateStr || null;
      this.selectedAppointmentId = arg.id;
      this.showModal();
    },

    onHideModal(evt) {
      if (evt.success) {
        this.$refs.fullCalendar.calendar.refetchEvents();
      }

      this.hideModal();
    },

    showModal() {
      this.isModalActive = true;
    },

    hideModal() {
      this.selectedAppointmentId = null;
      this.isModalActive = false;
    },

    async removeAppointment() {
      const { status } = await this.removeSelectedAppointment(this.selectedAppointmentId);
      // @todo handle else statement with the error notification
      console.log('REMOVE: ', status, this.selectedAppointmentId);
      if (status === 'removed') {
        this.onHideModal({ success: true });
      }

      this.hideMenu();
    },

    async toggleUsersCancellation() {
      const { status } = await this.handleCancellation(this.selectedAppointmentId);

      if (status === 'updated') {
        this.$refs.fullCalendar.calendar.refetchEvents();

        if (this.isShowMenu) {
          this.hideMenu();
        }
      }
      // @todo handle server errors, when status is not equal to 'updated'
    },

    async onDuplicateAppointment() {
      // use this.eventData
      console.log('Duplicate: ', this.user, this.eventData);
      const eventClone = {
        eventDate: new Date(this.eventData.eventDate),
        title: `${this.eventData.title} (copy)`,
        authorEmail: this.user.userEmail,
        authorId: this.user.userId,
        cancellations: this.eventData.cancellations,
        participants: this.eventData.participants,
      };
      const clearCancellations = this.eventData.cancellations.length > 0
        && window.confirm('Do you want to delete all the users from the cancellations list?');

      if (clearCancellations) {
        eventClone.cancellations = [];
      }

      if (this.disabled) {
        eventClone.participants = this.eventData.participants
            .filter((participant) => participant !== this.user.userEmail)
            .concat([this.eventData.author.email]);
      }

      const cloneStatus = await this.addAppointment(eventClone);

      // refetch events and drop selected appointments id
      if (cloneStatus.success) {
        this.onHideModal(cloneStatus);
        this.hideMenu();
      }
      // @todo handle errors
    },

    showMenu({ evt, itemId }) {
      this.menuPosition = this.setPosition(evt);
      this.selectedAppointmentId = itemId;
      this.isShowMenu = true;
    },

    hideMenu() {
      this.selectedAppointmentId = null;
      this.isShowMenu = false;
    },

    setPosition(event) {
      const coords = {
        left: `${event.x}px`,
        top: `${event.y}px`,
      };
      const documentWidth = document.documentElement.clientWidth;

      if ((event.x + 200) > documentWidth) {
        coords.left = `${event.x - (200 - (documentWidth - event.x))}px`;
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
      <div
        class="group flex justify-start pr-2 min-w-full text-white rounded-md"
        :class="[ arg.event.extendedProps?.cancelled ? 'bg-gray-500' : 'bg-main-light' ]"
        :title="arg.event.title"
      >
        <button
          class="text-ellipsis pl-1.5 overflow-hidden w-full rounded-l-md text-xs"
          :class="[ arg.event.extendedProps?.cancelled ? 'group-hover:bg-gray-600' : 'group-hover:bg-main-dark' ]"
          role="switch"
          @click="handleDateClick(arg.event)"
        >
          {{ arg.event.title }}
        </button>
        <menu-button
          :content="arg.event.id"
          @show-menu="showMenu"
        />
      </div>
    </template>
  </full-calendar>
  <base-modal
    v-if="isModalActive"
    :event-data="eventData"
    :event-day="eventDay"
    @hide-modal="onHideModal"
    @toggle-cancellation="toggleUsersCancellation"
    @remove-appointment="removeAppointment"
    @duplicate-appointment="onDuplicateAppointment"
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
            class="hover:bg-gray-700 px-3 py-2 rounded-b-md"
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