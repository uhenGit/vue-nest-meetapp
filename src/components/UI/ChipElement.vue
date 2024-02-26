<script setup>
defineProps({
  content: {
    type: String,
    required: true,
  },
  removable: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['remove-action']);
</script>
<template>
  <div
    class="bg-orange-300 text-white flex rounded-2xl cursor-default pr-1 pl-1.5 py-0.5 my-1 mr-1.5 font-bold"
    :class="{ 'pb-1 pr-1.5': !removable }"
  >
    <span class="">
      {{ content }}
    </span>
    <button
      v-if="removable"
      class="ml-1 opacity-60 inline-flex items-center justify-center rounded-full text-orange-700 cursor-pointer bg-white"
      @click="$emit('remove-action')"
    >
      <svg
        viewBox="0 0 24 24"
        class="w-5"
      >
        <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z">
        </path>
      </svg>
    </button>
  </div>
</template>