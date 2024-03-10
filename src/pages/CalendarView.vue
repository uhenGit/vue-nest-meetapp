<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAppointmentStore, useUserStore } from '@/stores';
import { mapActions, mapState } from 'pinia';
import BaseModal from '@/components/Modals/BaseModal.vue';
import ContextMenu from '@/components/Modals/ContextMenu.vue';
import MenuButton from '@/components/UI/MenuButton.vue';
import { isAuthor, getDate, getDateStr } from '@/utils';

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
        eventClick: this.handleEventClick,
        events: (info, successCb, failureCb) => {
          const { year, month } = getDate(info.start);
          const period = { year, month };
          this.loadCurrentMonthAppointments(period)
            .then((response) => {
              if (response.status === 'Unauthorized' || !response.status) {
                failureCb('Unauthorized');
              } else {
                successCb(this.visibleAppointments)
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
      console.log('Destroy');
      this.$refs.fullCalendar.getApi().destroy();
    }

    this.selectedAppointmentId = null;
  },

  computed: {
    ...mapState(useAppointmentStore, ['activeAppointments']),
    ...mapState(useUserStore, ['user']),

    /**
     * Handle current active appointments to add to every appointment, from the same day, an index,
     * that represents a place of the appointment in the virtual collection of the 'same day appointments'
     * @returns {Array} - same appointments array, but with the additional idx field
     * */
    processedAppointmentsBySameDay() {
      if (!this.activeAppointments) {
        return [];
      }

      const eventDateIndexes = {};

      return this.activeAppointments.map((appointment) => {
        const { date } = getDateStr(appointment.eventDate);

        if (!Object.prototype.hasOwnProperty.call(eventDateIndexes, date)) {
          eventDateIndexes[date] = 0;
        } else {
          eventDateIndexes[date]++;
        }

        return {
          ...appointment,
          sameDayCount: eventDateIndexes[date],
          eventDay: date,
          start: appointment.eventDate,
        }
      });
    },

    /**
     * If the number of appointments for one day is more than 2, slice to display only two of them
     * and a link to the page with the full list
     * */
    visibleAppointments() {
      const tempTwoDaysContainer = new Map();
      const twoAppointmentsFromDay = this.processedAppointmentsBySameDay
        .reduce((_, cV) => {
          const { sameDayCount, eventDay } = cV;
          const isContainerHasDay = tempTwoDaysContainer.has(eventDay);

          if (!isContainerHasDay && sameDayCount === 0) {
            tempTwoDaysContainer.set(eventDay, [cV]);
          }

          if (isContainerHasDay && sameDayCount === 1) {
            const existingTempEvent = tempTwoDaysContainer.get(eventDay);
            existingTempEvent.push(cV);
            tempTwoDaysContainer.set(eventDay, existingTempEvent);
          }

          if (isContainerHasDay && sameDayCount === 2) {
            const existingTempEvent = tempTwoDaysContainer.get(eventDay);
            existingTempEvent.push({
              title: 'Display all',
              start: `${eventDay}T22:59:59`,
              id: '-1',
              eventDay,
            });
            tempTwoDaysContainer.set(eventDay, existingTempEvent);
          }

          return Array.from(tempTwoDaysContainer.values());
        }, []);

      return twoAppointmentsFromDay.flat();
    },

    menuItems() {
      return [
        {
          name: 'Delete appointment',
          disable: this.disabled,
          action: this.disabled ? null : this.removeAppointment,
        },
        {
          name: 'Cancel appointment',
          disable: false,
          action: this.toggleUsersCancellation,
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
      if (this.isShowMenu) {
        this.hideMenu();

        return;
      }

      this.eventDay = arg.dateStr || null;
      this.selectedAppointmentId = arg.id;
      this.showModal();
    },

    async removeAppointment() {
      const { status, id } = await this.removeSelectedAppointment(this.selectedAppointmentId);
      // @todo handle else statement with the error notification
      if (status === 'removed' && id === this.selectedAppointmentId) {
        this.onHideModal({ success: true });
      }

      this.hideMenu();
    },

    async toggleUsersCancellation() {
      const { status } = await this.handleCancellation(this.selectedAppointmentId);

      if (status === 'updated') {
        this.$refs.fullCalendar.getApi().refetchEvents();

        if (this.isShowMenu) {
          this.hideMenu();
        }
      }
      // @todo handle server errors, when status is not equal to 'updated'
    },

    async onDuplicateAppointment() {
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

    onHideModal(evt) {
      if (evt.success) {
        this.$refs.fullCalendar.getApi().refetchEvents();
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

    goToPage(day) {
      this.$router.push({ name: 'selected day', params: { selectedDay: day } });
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
      <div class="flex flex-col w-full">
        <div
          v-if="arg.event.id !== '-1'"
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
        <div
          v-else
          class="cursor-pointer text-center text-xs border-b"
          @click="goToPage(arg.event.extendedProps.eventDay)"
        >
          {{ arg.event.title }}
        </div>
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