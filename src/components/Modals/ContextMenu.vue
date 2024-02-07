<script>
export default {
  name: 'ContextMenu',
  props: {
    coords: {
      type: Object,
      default: () => ({
        x: 0,
        y: 0,
      }),
    }
  },
  emits: ['hide-menu'],
  methods: {
    hideMenu() {
      console.log('HIDE')
      this.$emit('hide-menu');
    },
  },
}
</script>
<template>
  <div
    class="absolute w-1/5 z-10 bg-gray-800 rounded-md pt-3"
    :style="{ top: `${coords.y}px`, left: `${coords.x}px` }"
    tabindex="0"
    @blur="hideMenu"
  >
    <slot name="menu-name"/>
    <hr />
    <slot name="menu-list"/>
  </div>
</template>