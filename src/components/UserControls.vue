<script setup>
const logout = () => {
  localStorage.setItem('isLoggedIn', 'false');
}
</script>
<template>
  <div class="flex">
    <button @click="logout">
      Logout
    </button>
  </div>
</template>