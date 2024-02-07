<script>
import { mapActions, mapWritableState } from 'pinia';
import { useAppointmentStore, useUserStore } from '@/stores/index.js';
import { isAuthor, isValidEmail } from '@/utils';

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
        authorEmail: '',
        cancelled: false,
        participants: [],
        cancellations: [],
      },
      scheduledTime: null,
      scheduledDay: null,
      isInvalidEmail: false,
      isEmptyTitle: false,
      participantEmail: '',
    };
  },

  mounted() {
    const propsAuthorEmail = this.eventData.extendedProps?.author?.email;
    this.eventAuthor = propsAuthorEmail && propsAuthorEmail !== this.user.userEmail
        ? propsAuthorEmail
        : 'You';

    if (!this.eventData.dayEl) {
      this.event = {
        ...this.eventData.extendedProps,
        title: this.eventData.title,
        authorEmail: propsAuthorEmail,
      };
      const selectedDate = this.eventData.extendedProps.eventDate;
      this.scheduledDay = selectedDate.split('T')[0];
      this.scheduledTime = selectedDate.split('T')[1].split('.')[0];
    } else {
      this.scheduledDay = this.eventData.dateStr;
      this.scheduledTime = '09:00:00';
      this.event.authorId = this.user.userId;
      this.event.authorEmail = this.user.userEmail;
    }
  },

  computed: {
    ...mapWritableState(useUserStore, ['user']),

    disable() {
      return !isAuthor(this.event.authorId);
    },

    isCancelledAppointment() {
      return this.event.cancelled ? 'Yes' : 'No';
    },

    isPartlyCancelledAppointment() {
      return this.event.cancellations.length > 0;
    },
  },

  methods: {
    ...mapActions(useAppointmentStore, [
      'addAppointment',
      'loadCurrentMonthAppointments',
      'removeSelectedAppointment',
    ]),

    addParticipant() {
      this.isInvalidEmail = false;

      if (isValidEmail(this.participantEmail) && !this.event.participants.includes(this.participantEmail)) {
        this.event.participants.push(this.participantEmail);
        this.participantEmail = '';
      } else {
        this.isInvalidEmail = true;
      }
    },

    clearEmail() {
      this.participantEmail = '';
      this.isInvalidEmail = false;
      this.$refs.participantEmail.focus();
    },

    onToggleModal({ status }) {
      this.event = {
        title: '',
        authorId: '',
        authorEmail: '',
        cancelled: false,
        participants: [],
        cancellations: [],
      };
      this.scheduledTime = null;
      this.scheduledDay = null;
      this.$emit('toggle-modal', { status });
    },

    async onRemoveAppointment() {
      const { status } = await this.removeSelectedAppointment(this.eventData.publicId);
      this.$nextTick(() => {
        this.onToggleModal(status);
      })
    },

    async onSubmit() {
      if (!this.event.title) {
        this.isEmptyTitle = true;
        return;
      }

      this.event.eventDate = new Date(`${this.scheduledDay}T${this.scheduledTime}`);
      let response;

      // @todo add update appointment action; check actions errors and define an options
      // for toggle modal or error notification
      if (this.eventData.publicId) {
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
          class="absolute top-3 right-3 bg-gray-800 text-white rounded-md pl-3 pr-3 pb-0.5"
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
                :disabled="disable"
                class="rounded-md p-1 w-full"
                :class="{ 'border-red-700': isEmptyTitle }"
                @input.once="isEmptyTitle = false"
              />
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td class="pr-6">Event date</td>
            <td>
              <input
                v-model="scheduledDay"
                :disabled="disable"
                type="date"
                class="border-none cursor-pointer p-1"
              />
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td>Event time</td>
            <td>
              <input
                v-model="scheduledTime"
                :disabled="disable"
                type="time"
                class="border-none cursor-pointer p-1"
              />
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td class="pr-6">Event author</td>
            <td>
              <span>{{ eventAuthor }}</span>
            </td>
          </tr>
          <tr
            v-if="!disable"
            class="leading-10 border-b-2"
          >
            <td class="pr-6">Add new participant email</td>
            <td class="flex mt-2 relative">
              <div class="flex flex-col w-full">
                <input
                  ref="participantEmail"
                  v-model="participantEmail"
                  class="rounded-md p-1 w-full"
                  @keyup.enter="addParticipant"
                  @input="isInvalidEmail = false"
                />
                <span class="text-xs">
                  Hit the Enter key to add and validate emails
                </span>
              </div>
              <span
                v-if="isInvalidEmail"
                class="absolute right-3 bottom-4 after:content-['x'] after:ml-1.5 after:text-red-700 after:cursor-pointer"
                @click="clearEmail"
              >
              </span>
            </td>
          </tr>
          <tr class="leading-10 border-b-2">
            <td class="pr-6">Participants emails</td>
            <td class="flex">
              <template
                v-for="(participant, idx) in event.participants"
                :key="idx"
              >
                <span>
                  {{ participant }}
                </span>
                <span
                  v-if="idx !== event.participants.length - 1"
                >
                  ,&ensp;
                </span>
              </template>
              <span
                v-if="isInvalidEmail"
                class="text-red-700 text-sm font-bold mt-3 ml-3"
              >
                Invalid email
              </span>
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
      <div class="mt-10 w-full flex justify-around">
        <button
          v-if="eventData.publicId"
          class="text-red-700 bg-white border rounded-md pl-3 pr-3 pb-0.5"
          @click.stop="onRemoveAppointment"
        >
          delete
        </button>
        <button
            class="bg-gray-800 text-white rounded-md pl-3 pr-3 pb-0.5"
            @click.stop="onSubmit"
        >
          save
        </button>
      </div>
    </div>
  </div>
</template>
