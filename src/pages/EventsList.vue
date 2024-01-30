<script setup>
import { onMounted } from 'vue';
import { useAppointmentStore } from '@/stores';
import CalendarView from '@/components/CalendarView.vue';

const appointmentsStore = useAppointmentStore();
const currentDate = new Date();
const initialPeriod = {
  year: currentDate.getFullYear(),
  month: currentDate.getMonth() + 1,
};

onMounted(() => appointmentsStore.loadCurrentMonthAppointments(initialPeriod));
</script>
<template>
  <calendar-view
    v-if="appointmentsStore.loadedAppointments.has(appointmentsStore.selectedPeriod)"
  />
  <div v-else>Loading...</div>
</template>