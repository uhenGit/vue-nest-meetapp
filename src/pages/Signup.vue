<script>
import { mapActions } from 'pinia';
import { useUserStore } from '@/stores';

export default {
  name: 'SignUp',

  data() {
    return {
      email: '',
      password: '',
      userName: '',
      confirmPassword: '',
    };
  },

  computed: {
    isFormValid() {
      return this.email
        && this.password
        && this.password === this.confirmPassword;
    },
  },

  methods: {
    ...mapActions(useUserStore, ['signup', 'isLoggedIn', 'userError']),
    async onSignUp() {
      console.log('sign up: ', this.email, this.password);
      if (!this.isFormValid) {
        // notify about invalid form fields
        return;
      }

      const credentials = {
        userName: this.userName,
        email: this.email,
        password: this.password,
      };
      await this.signup(credentials);

      if (this.isLoggedIn) {
        this.$router.push({ name: 'home' });
      }
    },
  },
}
</script>
<template>
  <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        Create a new account
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form
          class="space-y-6"
          @submit.prevent="onSignUp"
      >
<!--        create a notification with this message (similar to login page)-->
        <div
            v-if="!isLoggedIn && userError"
            id="toast-simple"
            class="flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 bg-white divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800"
            role="alert"
        >
          <svg
              class="w-5 h-5 text-blue-600 dark:text-blue-500 rotate-45"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 18 20"
          >
            <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m9 17 8 2L9 1 1 19l8-2Zm0 0V9"
            />
          </svg>
          <div class="ps-4 text-sm font-normal">
            {{ userError }}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900">
            Email address
            <input
                v-model="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900">
            User name
            <input
                v-model="userName"
                name="name"
                type="text"
                autocomplete="user-name"
                class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900">
              Password
            <input
                v-model="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900">
            Confirm password
            <input
                v-model="confirmPassword"
              name="confirm"
              type="password"
              autocomplete="confirm-password"
              required
              class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
          </label>
        </div>
        <div>
          <button
              type="submit"
              class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Sign up
          </button>
        </div>
      </form>

      <p class="mt-10 text-center text-sm text-gray-500">
        Already have an account?
        <router-link
            :to="{ name: 'login' }"
            class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
          Login here
        </router-link>
      </p>
    </div>
  </div>
</template>