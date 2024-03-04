<script>
import { mapActions,mapState } from 'pinia';
import { useUserStore } from '@/stores';
import { isValidEmail } from '@/utils/index.js';

export default {
  name: 'LogIn',

  data() {
    return {
      email: null,
      password: null,
      loginError: null,
      isValidationFailed: false,
    }
  },

  computed: {
    ...mapState(useUserStore, ['user', 'userError', 'isLoggedIn']),
  },

  methods: {
    ...mapActions(useUserStore, ['login']),
    async onLogIn() {
      this.isValidationFailed = false;
      try {
        if (!isValidEmail(this.email)) {
          this.isValidationFailed = true;

          return;
        }

        const credentials = {
          email: this.email,
          password: this.password,
        };
        await this.login(credentials);

        if (this.isLoggedIn) {
          this.$router.push({ name: 'home' })
        }
      } catch (err) {
        console.log('Login error: ', err.message);
      }
    },
  },
}
</script>
<template>
  <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        Login to your account
      </h2>
    </div>
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form
          class="space-y-6"
          @submit.prevent="onLogIn"
      >
        <!-- change to notification after login -->
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
          <div class="ps-4 font-normal">
            {{ userError }}
          </div>
        </div>
        <div>
          <label class="block font-medium leading-6 text-gray-900">
            Email address
            <input
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6"
              :class="{ 'border-red-700 border-2': isValidationFailed }"
            />
            <span
              v-if="isValidationFailed"
              class="text-red-700 text-xs"
            >
              Invalid email
            </span>
          </label>
        </div>

        <div>
          <label class="block font-medium leading-6 text-gray-900">
            Password
            <input
                v-model="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6">
          </label>
          <div>
            <router-link
                :to="{ name: 'restore-pwd' }"
                class="font-semibold text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </router-link>
          </div>
        </div>

        <div>
          <button
              type="submit"
              class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Login
          </button>
        </div>
      </form>

      <p class="mt-10 text-center text-gray-500">
        Not a member?
        <router-link
            :to="{ name: 'signup' }"
            class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
          Sign up here
        </router-link>
      </p>
    </div>
  </div>
</template>