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
  <div class="border-2 border-blue-700 border-opacity-40 rounded-2xl cursor-default mr-1 my-1">
    <p
      class="relative py-0.5 pl-1.5 leading-none"
      :class="[ removable ? 'pr-7' : 'pr-1.5' ]"
    >
      <span class="">
        {{ content }}
      </span>
      <span
        v-if="removable"
        class="absolute right-1 top-2.5 mt-0.5 block w-1/5 h-1.5 leading-none after:block after:font-bold after:absolute after:bottom-0.5 after:right-0 after:content-['x'] after:leading-2 after:px-1 after:border after:rounded-full after:ml-1.5 after:text-orange-700 after:cursor-pointer after:border-orange-700"
        @click="$emit('remove-action')"
      >
      </span>
    </p>
  </div>
</template>