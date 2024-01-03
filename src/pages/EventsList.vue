<script setup>
import { useAppointmentStore } from '@/stores';
import CalendarView from '@/components/CalendarView.vue';
// import OneWeek from '@/components/Week.vue';

const appointmentsStore = useAppointmentStore();
console.log('handler: ', appointmentsStore.loadedMonths);
/* appointmentsStore.initializeMonths();
const addPrev = () => {
  appointmentsStore.addPreviousMonth();
}
const addNext = () => {
  appointmentsStore.addNextMonth();
} */
</script>
<template>
  <calendar-view />
</template>