<script>
import { mapActions, mapWritableState } from 'pinia';
import { useAppointmentStore, useUserStore } from '@/stores/index.js';
import { isAuthor, isValidEmail } from '@/utils';
import ChipElement from '@/components/UI/ChipElement.vue';
import ContextMenu from '@/components/Modals/ContextMenu.vue';
import MenuButton from '@/components/UI/MenuButton.vue';

export default {
  components: {
    ContextMenu,
    ChipElement,
    MenuButton,
  },

  props: {
    eventData: {
      type: Object,
      require: true,
    },
    eventDay: {
      type: String,
      default: null,
    },
  },

  emits: ['hide-modal', 'remove-appointment', 'toggle-cancellation', 'duplicate-appointment'],

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
      saveChanges: true,
      isShowMenu: false,
      menuPosition: {},
    };
  },

  mounted() {
    const propsAuthorEmail = this.eventData.author?.email;
    this.eventAuthor = propsAuthorEmail && propsAuthorEmail !== this.user.userEmail
        ? propsAuthorEmail
        : 'You';

    if (!this.eventDay) {
      this.event = structuredClone(this.eventData);
      const { eventDate } = this.eventData;
      const eventDayTime = eventDate.split('T');
      this.scheduledDay = eventDayTime[0];
      this.scheduledTime = eventDayTime[1].split('.')[0];
    } else {
      this.scheduledDay = this.eventDay;
      this.scheduledTime = '09:00:00';
      this.event.authorId = this.user.userId;
      this.event.authorEmail = this.user.userEmail;
    }
  },

  computed: {
    ...mapWritableState(useUserStore, ['user']),

    menuItems() {
      return [
        {
          name: 'Delete appointment',
          disable: this.eventData.id && !this.isAuthor,
          action: this.onRemoveAppointment,
        },
        {
          name: 'Cancel appointment',
          disable: false,
          action: () => this.$emit('toggle-cancellation'),
        },
        {
          name: 'Duplicate appointment',
          disable: false,
          action: () => this.$emit('duplicate-appointment'),
        },
      ]
    },

    isAuthor() {
      return isAuthor(this.event.authorId);
    },

    isCancelledAppointment() {
      return this.event.cancelled ? 'Yes' : 'No';
    },

    isPartlyCancelledAppointment() {
      return this.event.cancellations.length > 0;
    },

    cancelBtn() {
      return this.event.cancellations.includes(this.user.userEmail)
        ? 'recover me'
        : 'remove me from event';
    },

    // @todo fix json comparing, and loop through the arrays of participants and cancellations
    hasNoChanges() {
      const eventClone = {
        cancellations: this.event.cancellations,
        participants: this.event.participants,
        title: this.event.title,
      };
      const eventDataClone = {
        cancellations: this.eventData.cancellations,
        participants: this.eventData.participants,
        title: this.eventData.title,
      };
      const dateIdentity = this.checkDateIdentity('time') || this.checkDateIdentity('day');

      return (JSON.stringify(eventDataClone) === JSON.stringify(eventClone) && !dateIdentity);
    },
  },

  watch: {
    'eventData.cancellations'(newValue) {
      this.event.cancellations = newValue;
    }
  },

  beforeUnmount() {
    this.event = {
      title: '',
      authorId: '',
      authorEmail: '',
      cancelled: false,
      participants: [],
      cancellations: [],
    };
  },

  methods: {
    ...mapActions(useAppointmentStore, [
      'addAppointment',
      'removeSelectedAppointment',
      'updateAppointment',
    ]),

    hasChanges(fieldName) {
      if (fieldName === 'day' || fieldName === 'time') {
        return this.checkDateIdentity(fieldName);
      }

      return JSON.stringify(this.event[fieldName]) !== JSON.stringify(this.eventData[fieldName]);
    },

    checkDateIdentity(dateField) {
      if (!this.eventDay) {
        const eventDayTime = this.eventData.eventDate.split('T');

        return dateField === 'day'
          ? this.scheduledDay !== eventDayTime[0]
          : this.scheduledTime !== eventDayTime[1].split('.')[0];
      } else {
        return dateField === 'day'
          ? this.scheduledDay !== this.eventDay
          : this.scheduledTime !== '09:00:00';
      }
    },

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

    clearFrames() {
      this.isEmptyTitle = false;
      this.saveChanges = true;
      this.isInvalidEmail = false;
    },

    onHideModal({ success }) {
      this.$emit('hide-modal', { success });
    },

    showMenu({ evt }) {
      this.menuPosition = this.setPosition(evt);
      this.isShowMenu = true;
    },

    hideMenu() {
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

    onRemoveAppointment() {
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
      this.$emit('remove-appointment');
    },

    onDeleteParticipant(emailToDelete) {
      this.event.participants = this.event.participants.filter((email) => email !== emailToDelete);
    },

    async onSubmit() {
      if (!this.event.title) {
        this.isEmptyTitle = true;
        return;
      }

      if (this.eventData.id && !this.hasNoChanges) {
        this.saveChanges = window.confirm('The document has unsaved changes. Click "Yes" to save the changes.');

        if (!this.saveChanges) {
          return;
        }
      }

      this.event.eventDate = new Date(`${this.scheduledDay}T${this.scheduledTime}`);
      let response;

      // @todo check actions errors and define an options
      // for toggle modal or error notification
      if (this.eventData.id) {
        response = await this.updateAppointment(this.event);
      } else {
        response = await this.addAppointment(this.event);
      }

      this.$nextTick(() => {
        this.onHideModal(response);
      });
    },
  },
}
</script>
<template>
  <div
    class="fixed w-full bg-black bg-opacity-40 h-screen top-0 left-0 flex justify-center px-8 z-20 text-md"
    @click.stop="onHideModal"
  >
    <div
      class="relative p-12 self-start bg-white my-auto min-w-full max-w-screen-md rounded-md z-30"
      @click.stop
    >
      <button
          class="absolute top-3 right-3 bg-gray-800 text-white rounded-md pl-3 pr-3 pb-0.5"
          @click.stop="onHideModal"
      >
        close
      </button>
      <div class="flex relative">
        <h3 class="text-2xl font-bold">
          {{ modalTitle }}
        </h3>
        <div class="absolute right-0 group">
          <menu-button @show-menu="showMenu"/>
        </div>
      </div>
      <table
        class="table-fixed min-w-full mt-4"
      >
        <tbody>
          <tr class="leading-5 border-b-2">
            <td class="pr-6">Title</td>
            <td>
              <input
                v-model="event.title"
                :disabled="!isAuthor"
                class="rounded-md p-1 w-full border-opacity-40 text-md"
                :class="{
                  'border-red-700': isEmptyTitle,
                  'border-orange-700 bg-orange-100': (hasChanges('title') && !saveChanges)
                }"
                @input.once="clearFrames"
              />
            </td>
          </tr>
          <tr class="leading-5 border-b-2">
            <td class="pr-6">Event date</td>
            <td>
              <input
                v-model="scheduledDay"
                :disabled="!isAuthor"
                type="date"
                class="cursor-pointer p-1 text-md"
                :class="[ (hasChanges('day') && !saveChanges)
                  ? 'border-orange-700 bg-orange-100 rounded-md'
                  : 'border-none' ]"
                @input="clearFrames"
              />
            </td>
          </tr>
          <tr class="leading-5 border-b-2">
            <td>Event time</td>
            <td>
              <input
                v-model="scheduledTime"
                :disabled="!isAuthor"
                type="time"
                class="cursor-pointer p-1 text-md"
                :class="[ (hasChanges('time') && !saveChanges)
                  ? 'border-orange-700 bg-orange-100 rounded-md'
                  : 'border-none' ]"
                @input="clearFrames"
              />
            </td>
          </tr>
          <tr class="leading-5 border-b-2">
            <td class="pr-6">Event author</td>
            <td>
              <p class="p-1">
                {{ eventAuthor }}
              </p>
            </td>
          </tr>
          <tr
            v-if="isAuthor"
            class="leading-5 border-b-2"
          >
            <td class="pr-6">Add new participant email</td>
            <td class="flex mt-2 relative">
              <div class="flex flex-col w-full">
                <input
                  ref="participantEmail"
                  v-model="participantEmail"
                  class="rounded-md p-1 w-full"
                  @keyup.enter="addParticipant"
                  @input="clearFrames"
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
          <tr class="leading-5 border-b-2">
            <td class="pr-6">Participants emails</td>
            <td
              class="flex"
              :class="{
                'border-orange-700 bg-orange-100': (hasChanges('participants') && !saveChanges)
            }"
            >
              <template
                v-for="(participant, idx) in event.participants"
                :key="idx"
              >
                <chip-element
                  :content="participant"
                  :removable="eventData.author?.email === user.userEmail"
                  @remove-action="onDeleteParticipant(participant)"
                />
              </template>
              <span
                v-if="isInvalidEmail"
                class="text-red-700 font-bold mt-3 ml-3"
              >
                Invalid email
              </span>
            </td>
          </tr>
          <tr class="leading-5 border-b-2">
            <td class="pr-6">Cancelled by all participants</td>
            <td>
              <p class="p-1">
                {{ isCancelledAppointment }}
              </p>
            </td>
          </tr>
          <tr
            v-if="isPartlyCancelledAppointment"
            class="leading-5 border-b-2"
          >
            <td class="pr-6">Participants that cancelled</td>
            <td
              class="flex flex-wrap"
              :class="{
              'border-orange-700 bg-orange-100': (hasChanges('cancellations') && !saveChanges)
            }">
              <template
                v-for="(refuser, idx) in event.cancellations"
                :key="idx"
              >
                <chip-element :content="refuser"/>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-10 w-full flex justify-end">
<!--        <div>-->
<!--          <button-->
<!--            v-if="eventData.id && isAuthor"-->
<!--            class="text-red-800 bg-white hover:bg-red-800 hover:text-white border rounded-md px-20 pb-0.5 mr-2"-->
<!--            @click.stop="onRemoveAppointment"-->
<!--          >-->
<!--            delete-->
<!--          </button>-->
<!--          <button-->
<!--            class="text-orange-400 bg-white hover:bg-orange-400 hover:text-white border rounded-md px-20 pb-0.5"-->
<!--            @click.stop="$emit('toggle-cancellation')"-->
<!--          >-->
<!--            {{ cancelBtn }}-->
<!--          </button>-->
<!--        </div>-->
        <button
          v-if="isAuthor"
          class="text-white rounded-md px-20 pb-0.5"
          :class="[ hasNoChanges ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800']"
          :disabled="hasNoChanges"
          @click.stop="onSubmit"
        >
          save
        </button>
      </div>
    </div>
    <context-menu
        v-if="isShowMenu && eventData.id"
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
  </div>
</template>
