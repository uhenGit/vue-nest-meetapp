<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default {
  name: 'CalendarView',
  components: {
    FullCalendar,
  },
  data() {
    return {
      basicCalendarOptions: {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
      },
      arg: {
        title: 'TITLE'
      }
    }
  },
}
</script>
<template>
  <full-calendar :options="basicCalendarOptions">
    <template #eventContent="arg">
      <strong>{{ arg.title }}</strong>
    </template>
  </full-calendar>
</template>