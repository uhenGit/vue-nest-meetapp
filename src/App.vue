<script>
import { mapActions, mapState } from 'pinia';
import { useUserStore } from '@/stores';
import './index.css';

export default {
  name: 'App',

  computed: {
    ...mapState(useUserStore, ['isLoggedIn']),
  },

  methods: {
    ...mapActions(useUserStore, ['logout']),

    onLogout() {
      this.logout();
      this.$router.push({ name: 'login' });
    },
  },
}
</script>
<template>
  <nav
      v-if="isLoggedIn"
      class="bg-gray-800"
  >
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <div class="absolute top-0 right-0 flex items-center pr-2">
          <button
              type="button"
              class="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white mt-2"
          >
            <span class="absolute -inset-1.5"></span>
            <span class="sr-only">View notifications</span>
            <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
            >
              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </button>
          <div class="relative ml-3 mt-3">
            <div>
              <button
                  type="button"
                  class="relative flex rounded-full bg-gray-800 text-sm"
                  @click="onLogout"
              >
                <span class="sr-only">Logout</span>
                <img
                    class="h-8 w-8 rounded-full"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="avatar"
                >
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
  <router-view></router-view>
</template>
