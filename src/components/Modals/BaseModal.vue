<script>
import { mapActions, mapState } from 'pinia';
import { useAppointmentStore, useUserStore } from '@/stores';
import { isAuthor, isValidEmail, getDateStr, setPosition } from '@/utils';
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
      this.event = { ...this.eventData };
      const { time, date } = getDateStr(this.eventData.eventDate);
      this.scheduledDay = date;
      this.scheduledTime = time;
    } else {
      this.scheduledDay = this.eventDay;
      this.scheduledTime = '09:00:00';
      this.event.authorId = this.user.userId;
      this.event.authorEmail = this.user.userEmail;
      this.event.participants.push(this.user.userEmail);
    }
  },

  computed: {
    ...mapState(useUserStore, ['user']),

    menuItems() {
      return [
        {
          name: 'Delete appointment',
          disable: (this.eventData.id && !this.isAuthor) || !this.eventData.id,
          action: this.onRemoveAppointment,
        },
        {
          name: 'Cancel appointment',
          disable: false,
          action: this.handleCancellation,
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

    isCancelledByAuthor: {
      get() {
        return !this.eventDay && this.eventData.cancellations.includes(this.eventData.author.email);
      },
      set(val) {
        if(val) {
          this.event.cancellations.push(this.user.userEmail);
        } else {
          this.event.cancellations = this.event.cancellations.filter((email) => email !== this.user.userEmail)
        }
      }
    },

    // @todo fix json comparing, and loop through the arrays of participants and cancellations
    hasNoChanges() {
      const eventClone = {
        cancellations: this.event.cancellations,
        participants: this.event.participants,
        title: this.event.title,
      };
      const eventDataClone = {
        cancellations: this.eventData.cancellations || [],
        participants: this.eventData.participants || [],
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

    setChipType(email) {
      return this.event.cancellations.includes(email)
        ? 'warning'
        : 'success';
    },

    checkDateIdentity(dateField) {
      if (!this.eventDay) {
        const { date, time } = getDateStr(this.eventData.eventDate);

        return dateField === 'day'
          ? this.scheduledDay !== date
          : this.scheduledTime !== time;
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

    onHideModal(evt) {
      this.hideMenu();

      if (evt.target?.role !== 'menuitem') {
        this.$emit('hide-modal', { success: evt.success });
      }
    },

    showMenu({ evt }) {
      this.menuPosition = setPosition(evt);
      this.isShowMenu = true;
    },

    hideMenu() {
      this.isShowMenu = false;
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

    handleCancellation() {
      this.$emit('toggle-cancellation');
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
                  @keyup.enter.prevent="addParticipant"
                  @input="clearFrames"
                />
                <span class="text-xs">
                  Hit the Enter key to add and validate emails
                </span>
              </div>
              <button
                v-if="isInvalidEmail"
                class="absolute right-3 bottom-7 ml-1 opacity-60 inline-flex items-center justify-center rounded-full text-orange-700 cursor-pointer bg-white"
                @click="clearEmail"
              >
                <svg
                    viewBox="0 0 24 24"
                    class="w-5"
                >
                  <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z">
                  </path>
                </svg>
              </button>
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
                  :removable="isAuthor"
                  :type="setChipType(participant)"
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
            <td class="pr-6">Cancelled by author {{ isCancelledByAuthor ? '(Cancelled)' : '(Not cancelled)' }}</td>
            <td class="pb-1.5">
              <!-- TW Elements is free under AGPL, with commercial license required for specific uses. See more details: https://tw-elements.com/license/ and contact us for queries at tailwind@mdbootstrap.com -->
              <input
                v-model="isCancelledByAuthor"
                class="mr-2 h-3.5 w-8 appearance-none rounded-[0.4375rem] bg-neutral-300 before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:rounded-full before:bg-transparent before:content-[''] after:absolute after:z-[2] after:-mt-[0.1875rem] after:h-5 after:w-5 after:rounded-full after:border-none after:bg-neutral-100 after:shadow-[0_0px_3px_0_rgb(0_0_0_/_7%),_0_2px_2px_0_rgb(0_0_0_/_4%)] after:transition-[background-color_0.2s,transform_0.2s] after:content-[''] checked:bg-main-light checked:after:absolute checked:after:z-[2] checked:after:-mt-[3px] checked:after:ml-[1.0625rem] checked:after:h-5 checked:after:w-5 checked:after:rounded-full checked:after:border-none checked:after:bg-main-light checked:after:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),_0_2px_2px_0_rgba(0,0,0,0.14),_0_1px_5px_0_rgba(0,0,0,0.12)] checked:after:transition-[background-color_0.2s,transform_0.2s] checked:after:content-[''] hover:cursor-pointer focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[3px_-1px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-5 focus:after:w-5 focus:after:rounded-full focus:after:content-[''] checked:focus:border-main-light checked:focus:bg-main-light checked:focus:before:ml-[1.0625rem] checked:focus:before:scale-100 checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:bg-neutral-600 dark:after:bg-neutral-400 dark:checked:bg-main-light dark:checked:after:bg-main-light dark:focus:before:shadow-[3px_-1px_0px_13px_rgba(255,255,255,0.4)]"
                type="checkbox"
                role="switch"
                id="flexSwitchCheckDefault"
                :disabled="!isAuthor"
                @change="handleCancellation"
              />
              <label
                class="inline-block pl-[0.15rem] hover:cursor-pointer pt-1"
                for="flexSwitchCheckDefault"
              >Only owner can change it</label
              >
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-10 w-full flex justify-end">
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
              @click.prevent="item.action"
          >
            {{ item.name }}
          </li>
        </ul>
      </template>
    </context-menu>
  </div>
</template>
