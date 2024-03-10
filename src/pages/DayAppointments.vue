<script>
import { mapState } from 'pinia';
import { getDateStr } from '@/utils/index.js';
import { useAppointmentStore } from '@/stores/index.js';
import BaseModal from '@/components/Modals/BaseModal.vue';

export default {
  name: 'DayAppointments',

  components: {
    BaseModal,
  },

  beforeRouteEnter(from, to, next) {
    next((vm) => {
      vm.selectedDay = from.params.selectedDay;
    });
  },

  data() {
    return {
      selectedDay: null,
      isShowModal: false,
      eventData: null,
      eventDay: null,
    }
  },

  computed: {
    ...mapState(useAppointmentStore, ['activeAppointments']),

    selectedDayAppointments() {
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
    showModal(event) {
      this.eventData = event;
      this.isShowModal = true;
    },

    onHideModal() {
      this.isShowModal = false;
    },
  },
}
</script>
<template>
  <div class="flex justify-around my-4">
    <div class="flex">
      <p class="text-2xl">Details for:</p>&ensp;
      <p>{{ selectedDay }}</p>
    </div>
    <router-link :to="{ name: 'home' }">
      <button class="bg-main-light px-2 text-white rounded-md mr-1">
        Back
      </button>
    </router-link>
  </div>
  <ul
    class="divide-gray-100 divide-y"
  >
    <li
      v-for="appointment in selectedDayAppointments"
      :key="appointment.id"
      class="flex justify-between gap-x-6 py-5"
    >
      <div
        class="flex gap-x-4 w-full items-center"
      >
        <span
          class="flex-none h-8 w-8 rounded-full bg-gray-200"
        >
          <svg
            v-if="appointment.cancelled"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            class="bi bi-calendar-x"
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
            class="w-full h-full"
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
            @click="showModal(appointment)"
          >
            View details
          </button>
        </div>
      </div>

    </li>
  </ul>
  <base-modal
    v-if="isShowModal"
    :event-data="eventData"
    :event-day="eventDay"
    @hide-modal="onHideModal"
  />
</template>