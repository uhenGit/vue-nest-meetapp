<script>
import { mapActions, mapWritableState } from 'pinia';
import { useAppointmentStore, useUserStore } from '@/stores/index.js';

export default {
  props: {
    eventData: {
      type: Object,
      require: true,
    },
  },

  emits: ['toggle-modal'],

  data() {
    return {
      modalTitle: this.eventData.dayEl ? 'Create new appointment' : 'View or edit appointment',
      event: {
        title: '',
        authorId: '',
        cancelled: false,
        participants: [],
        cancellations: [],
      },
      scheduledTime: null,
      scheduledDay: null,
    };
  },

  mounted() {
    const propsAuthorId = this.eventData._def?.extendedProps?.authorId;
    this.eventAuthor = propsAuthorId && propsAuthorId !== this.user.userId
        ? 'Another user' // @todo get author from DB by authorId
        : 'You';

    if (!this.eventData.dayEl) {
      this.event = {
        ...this.eventData._def.extendedProps,
        title: this.eventData._def.title,
      };
      const selectedDate = this.eventData._def.extendedProps.eventDate;
      this.scheduledDay = selectedDate.split('T')[0];
      this.scheduledTime = selectedDate.split('T')[1].split('.')[0];
    } else {
      this.scheduledDay = this.eventData.dateStr;
      this.scheduledTime = '09:00:00';
      this.event.authorId = this.user.userId;
    }
  },

  computed: {
    ...mapWritableState(useUserStore, ['user']),

    isCancelledAppointment() {
      return this.event.cancelled ? 'Yes' : 'No';
    },

    isPartlyCancelledAppointment() {
      return this.event.cancellations.length > 0;
    },
  },

  methods: {
    ...mapActions(useAppointmentStore, ['addAppointment', 'loadCurrentMonthAppointments']),

    onToggleModal({ status }) {
      this.$emit('toggle-modal', { status });
    },

    async onSubmit() {
      this.event.eventDate = new Date(`${this.scheduledDay}T${this.scheduledTime}`);
      let response;

      // @todo add update appointment action; check actions errors and define an options
      // for toggle modal or error notification
      if (this.eventData._def?.publicId) {
        // await this.updateAppointment(this.event);
      } else {
        response = await this.addAppointment(this.event);
      }

      this.$nextTick(() => {
        this.onToggleModal(response);
      });
    },
  },
}
</script>
<template>
  <div
    class="fixed w-full bg-black bg-opacity-40 h-screen top-0 left-0 flex justify-center px-8 z-20"
    @click.stop="onToggleModal"
  >
    <div
      class="relative p-12 self-start bg-white mt-20 min-w-full max-w-screen-md rounded-md z-30"
      @click.stop
    >
      <button
          class="absolute top-3 right-3 bg-gray-800 text-white rounded-md pb-0.5 px-1"
          @click.stop="onToggleModal"
      >
        close
      </button>
      <h3 class="text-2xl font-bold">
        {{ modalTitle }}
      </h3>
      <table
        class="table-auto min-w-full mt-4"
      >
        <tbody>
          <tr class="leading-10 border-b-2">
            <td class="pr-6">Title</td>
            <td>
              <input
                v-model="event.title"
                class="rounded-md p-1"
              />
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td class="pr-6">Event date</td>
            <td>
              <input
                v-model="scheduledDay"
                type="date"
                class="rounded-md p-1"
              />
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td>Event time</td>
            <td>
              <input
                ref="eventTime"
                type="time"
                v-model="scheduledTime"
                class="rounded-md p-1"
              />
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td class="pr-6">Event author</td>
            <td>
              <span>{{ eventAuthor }}</span>
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td class="pr-6">Participants emails</td>
            <td>
              <template
                v-for="(participant, idx) in event.participants"
                :key="idx"
              >
                <span >
                  {{ participant }}
                </span>
                <span
                  v-if="idx !== event.participants.length - 1"
                >
                  ,&ensp;
                </span>
              </template>
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td class="pr-6">Cancelled by all participants</td>
            <td>{{ isCancelledAppointment }}</td>
          </tr>
          <tr
            v-if="isPartlyCancelledAppointment"
            class="leading-10 border-b-2"
          >
            <td class="pr-6">Participants that cancelled</td>
            <td>
              <template
                v-for="(refuser, idx) in event.cancellations"
                :key="idx"
              >
                <span>{{ refuser }}</span>
                <span
                  v-if="idx !== event.cancellations.length - 1"
                >
                  ,&ensp;
                </span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <button
          class="absolute bottom-3 right-3 bg-gray-800 text-white rounded-md pb-0.5 px-1"
          @click.stop="onSubmit"
      >
        save
      </button>
    </div>
  </div>
</template>
