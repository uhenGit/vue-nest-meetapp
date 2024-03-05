<script>
export default {
  name: 'ContextMenu',
  props: {
    menuPosition: {
      type: Object,
      default: () => ({}),
    }
  },

  emits: ['hide-menu'],

  mounted() {
    document.addEventListener('mousedown', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  },

  methods: {
    handleClickOutside(evt) {
      // prevent hide-menu event and handle it in the parent
      if (['menu', 'menuitem', 'menubar', 'switch'].includes(evt.target.role)
          || 'date' in evt.target.dataset
          || evt.target.classList.contains('fc-daygrid-day-top')) {

        return;
      }

      this.$emit('hide-menu');
    },
  },
}
</script>
<template>
  <div
    class="absolute w-1/5 z-50 bg-gray-800 rounded-md pt-3"
    :style="menuPosition"
    role="menu"
  >
    <slot name="menu-name"/>
    <hr />
    <slot name="menu-list"/>
  </div>
</template>