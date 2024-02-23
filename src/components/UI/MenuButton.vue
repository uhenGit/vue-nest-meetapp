<script setup>
const props = defineProps({
  content: {
    type: String,
    default: '',
  },
});
const onShowMenu = defineEmits(['show-menu']);
const showMenu = (evt) => {
  onShowMenu('show-menu',{ evt, itemId: props.content });
}
</script>
<template>
  <button
      class="bg-white ml-2 my-2 group-hover:bg-gray-300 text-gray-950 rounded-full w-4 h-4 relative"
      @click.stop="showMenu($event)"
  >
    <svg
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        fill="#3d3846"
        class="w-4 h-4"
    >
      <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
    </svg>
  </button>
</template>