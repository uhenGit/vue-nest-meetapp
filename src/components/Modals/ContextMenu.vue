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
      if (['menu', 'menuitem', 'menubar'].includes(evt.target.role)) {
        return;
      }

      this.$emit('hide-menu');
    },
  },
}
</script>
<template>
  <div
    class="absolute w-1/5 z-10 bg-gray-800 rounded-md pt-3"
    :style="menuPosition"
    role="menu"
  >
    <slot name="menu-name"/>
    <hr />
    <slot name="menu-list"/>
  </div>
</template>