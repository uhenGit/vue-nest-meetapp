<script>
import { mapState, mapActions } from 'pinia';
import { getDateStr, setPosition, isAuthor, getDate } from '@/utils';
import { useAppointmentStore, useUserStore } from '@/stores';
import BaseModal from '@/components/Modals/BaseModal.vue';
import ContextMenu from '@/components/Modals/ContextMenu.vue';
import MenuButton from '@/components/UI/MenuButton.vue';

export default {
  name: 'DayAppointments',

  components: {
    BaseModal,
    ContextMenu,
    MenuButton,
  },

  beforeRouteEnter(from, to, next) {
    next((vm) => {
      vm.selectedDay = from.params.selectedDay;
      const { year, month } = getDate(new Date(vm.selectedDay));
      vm.period = { year, month };
    });
  },

  data() {
    return {
      selectedDay: null,
      period: null,
      isModalActive: false,
      eventDay: null,
      isShowMenu: false,
      menuPosition: null,
      selectedAppointmentId: null,
    }
  },

  computed: {
    ...mapState(useAppointmentStore, ['activeAppointments']),
    ...mapState(useUserStore, ['user']),

    menuItems() {
      return [
        {
          name: 'Delete appointment',
          disable: this.disabled,
          action: this.disabled ? null : this.onRemoveAppointment,
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
          disable: false,
          action: () => {
            const selectedAppointment = this.selectedDayAppointments.find(({ id }) => id === this.selectedAppointmentId);
            this.hideMenu();
            this.showModal(selectedAppointment.id);
          }
        },
      ];
    },

    disabled() {
      return !!this.selectedAppointmentId && !isAuthor(this.eventData?.authorId);
    },

    eventData() {
      if (!this.selectedAppointmentId) {
        return {};
      }

      return this.selectedDayAppointments.find(({ id }) => id === this.selectedAppointmentId);
    },

    selectedDayAppointments() {
      if (!this.activeAppointments) {
        return {};
      }

      return this.activeAppointments
        .filter(({ eventDate }) => getDateStr(eventDate).date === this.selectedDay)
        .map((item) => {
          const { date, time } = getDateStr(item.eventDate);

          return {
            ...item,
            eventDay: date,
            eventTime: time,
            isCancelled: item.cancelled ? 'Yes' : 'No',
          };
        });
    },
  },

  methods: {
    ...mapActions(useAppointmentStore, [
      'loadCurrentMonthAppointments',
      'removeSelectedAppointment',
      'handleCancellation',
      'addAppointment',
    ]),

    async onRemoveAppointment() {
      const { status, id } = await this.removeSelectedAppointment(this.selectedAppointmentId);

      if (status === 'removed' && id ===this.selectedAppointmentId) {
        await this.hideModal({ success: true });
      }

      this.hideMenu();
    },

    async toggleUsersCancellation() {
      const { status } = await this.handleCancellation(this.selectedAppointmentId);

      if (status === 'updated') {
        await this.loadCurrentMonthAppointments(this.period);

        if (this.isShowMenu) {
          this.hideMenu();
        }
      }
    },

    async onDuplicateAppointment() {
      const eventClone = {
        eventDate: new Date(this.eventData.eventDate),
        title: `${this.eventData.title} (copy)`,
        authorEmail: this.user.userEmail,
        authorId: this.user.userId,
        cancellations: this.eventData.cancellations,
        participants: this.eventData.participants,
        cancelled: this.eventData.cancelled,
      };
      const clearCancellations = this.eventData.cancellations.length > 0
          && window.confirm('Do you want to delete all the users from the cancellations list?');

      if (clearCancellations) {
        eventClone.cancellations = [];
        eventClone.cancelled = false;
      }

      const cloneStatus = await this.addAppointment(eventClone);

      if (cloneStatus.success) {
        await this.hideModal(cloneStatus);
        this.hideMenu();
      }
    },

    showModal(itemId) {
      if (!itemId) {
        this.eventDay = this.selectedDay;
      }

      this.selectedAppointmentId = itemId;
      this.isModalActive = true;
    },

    async hideModal(evt) {
      if (evt && evt.success) {
        await this.loadCurrentMonthAppointments(this.period);
      }

      this.isModalActive = false;
      this.selectedAppointmentId = null;
    },

    showMenu({ evt, itemId }) {
      this.selectedAppointmentId = itemId;
      this.menuPosition = setPosition(evt);
      this.isShowMenu = true;
    },

    hideMenu() {
      this.isShowMenu = false;
      this.menuPosition = null;
      this.selectedAppointmentId = null;
    },
  },
}
</script>
<template>
  <div class="flex justify-around my-4">
    <div class="flex">
      <p class="text-2xl">
        Details for:
      </p>&ensp;
      <p>
        {{ selectedDay }}
      </p>
    </div>
    <router-link :to="{ name: 'home' }">
      <button class="bg-main-light px-2 text-white rounded-md mr-1">
        Back
      </button>
    </router-link>
  </div>
  <ul class="divide-gray-100 divide-y">
    <li
      v-for="appointment in selectedDayAppointments"
      :key="appointment.id"
      class="flex justify-between gap-x-6 py-5"
    >
      <div class="flex gap-x-4 w-full items-center group">
        <span class="flex-none h-8 w-8 bg-gray-200">
          <svg
            v-if="appointment.cancelled"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              d="M6.146 7.146a.5.5 0 0 1 .708 0L8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708"
            />
            <path
              d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"
            />
            <path
              d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"
            />
          </svg>
        </span>
        <div class="flex-none flex-col text-center">
          <p>
            {{ appointment.eventDay }}
          </p>
          <p>
            {{ appointment.eventTime }}
          </p>
        </div>
        <div class="flex-none basis-2/4 flex-col ml-5">
          <p class="font-bold mb-1.5">
            {{ appointment.title }}
          </p>
          <p>
            Participants quantity: {{ appointment.participants.length }}
          </p>
          <p>
            Cancellations quantity: {{ appointment.cancellations.length }}
          </p>
        </div>
        <div class="flex-none basis-1/4 flex-col p-1">
          <p class="text-md">
            Is cancelled by all participants: {{ appointment.isCancelled }}
          </p>
          <button
            class="text-ellipsis overflow-hidden rounded-md text-md text-white bg-main-light hover:bg-main-dark p-1 mt-2"
            :class="{ 'bg-gray-600': appointment.cancelled }"
            @click="showModal(appointment.id)"
          >
            View details
          </button>
        </div>
        <menu-button
          :content="appointment.id"
          @show-menu="showMenu"
        />
      </div>

    </li>
  </ul>
  <div class="w-full flex justify-center">
    <button
      class="w-3/4 bg-main-light text-white hover:bg-main-dark rounded-md my-3 py-1.5"
      @click="showModal(null)"
    >
      Create appointment
    </button>
  </div>
  <base-modal
    v-if="isModalActive"
    :event-data="eventData"
    :event-day="eventDay"
    @toggle-cancellation="toggleUsersCancellation"
    @remove-appointment="onRemoveAppointment"
    @duplicate-appointment="onDuplicateAppointment"
    @hide-modal="hideModal"
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