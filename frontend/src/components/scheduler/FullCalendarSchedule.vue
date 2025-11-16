<script setup lang="ts">
import { ref, computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru.js';
import type { EventInput } from '@fullcalendar/core';
import type { Appointment } from '~/types/appointment';

const props = defineProps<{
  appointments: Appointment[];
  initialDate?: Date;
}>();

const emit = defineEmits<{
  (e: 'eventClick', event: { id: string }): void;
  (e: 'eventDrop', event: { id: string; start: string; end: string }): void;
  (e: 'eventResize', event: { id: string; start: string; end: string }): void;
  (e: 'dateClick', date: Date): void;
  (e: 'viewChange', view: string): void;
}>();

const calendarRef = ref<InstanceType<typeof FullCalendar>>();
const currentView = ref('timeGridWeek');
const lastEmittedView = ref<string | null>(null);

// Преобразуем appointments в формат FullCalendar
const calendarEvents = computed<EventInput[]>(() => {
  return props.appointments.map((apt) => ({
    id: apt.id,
    title: apt.patient
      ? `${apt.patient.firstName} ${apt.patient.lastName}`
      : 'Неизвестный пациент',
    start: apt.startTime,
    end: apt.endTime,
    extendedProps: {
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      doctorName: apt.doctor
        ? `${apt.doctor.firstName} ${apt.doctor.lastName}`
        : undefined,
      notes: apt.notes,
      status: apt.status,
    },
    backgroundColor: getStatusColor(apt.status),
    borderColor: getStatusColor(apt.status),
  }));
});

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return '#10b981'; // green
    case 'cancelled':
      return '#ef4444'; // red
    default:
      return '#3b82f6'; // blue
  }
};

const handleEventClick = (info: any) => {
  emit('eventClick', { id: info.event.id });
};

const handleEventDrop = (info: any) => {
  emit('eventDrop', {
    id: info.event.id,
    start: info.event.start.toISOString(),
    end: info.event.end?.toISOString() || info.event.start.toISOString(),
  });
};

const handleEventResize = (info: any) => {
  emit('eventResize', {
    id: info.event.id,
    start: info.event.start.toISOString(),
    end: info.event.end?.toISOString() || info.event.start.toISOString(),
  });
};

const handleDateClick = (info: any) => {
  emit('dateClick', info.date);
};

const handleViewChange = () => {
  if (calendarRef.value) {
    const view = calendarRef.value.getApi().view.type;
    // Эмитим событие только если вид действительно изменился
    if (view !== lastEmittedView.value) {
      currentView.value = view;
      lastEmittedView.value = view;
      emit('viewChange', view);
    }
  }
};

const goToToday = () => {
  calendarRef.value?.getApi().today();
};

const prev = () => {
  calendarRef.value?.getApi().prev();
};

const next = () => {
  calendarRef.value?.getApi().next();
};

const changeView = (view: string) => {
  calendarRef.value?.getApi().changeView(view);
};

// Опции календаря
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  initialDate: props.initialDate,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  locale: ruLocale,
  firstDay: 1, // Понедельник
  slotMinTime: '08:00:00',
  slotMaxTime: '20:00:00',
  slotDuration: '00:30:00',
  slotLabelInterval: '01:00:00',
  allDaySlot: false,
  height: 'auto',
  events: calendarEvents.value,
  editable: true,
  droppable: false,
  eventResizableFromStart: true,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  dateClick: handleDateClick,
  datesSet: () => {
    // datesSet вызывается слишком часто, не используем его для viewChange
  },
  viewDidMount: handleViewChange,
  eventContent: (arg: any) => {
    const event = arg.event;
    const extendedProps = event.extendedProps;
    const doctorHtml = extendedProps.doctorName
      ? `<div class="fc-event-time">${extendedProps.doctorName}</div>`
      : '';
    return {
      html: `<div class="fc-event-main-frame"><div class="fc-event-title-container"><div class="fc-event-title fc-sticky">${event.title}</div>${doctorHtml}</div></div>`,
    };
  },
}));

defineExpose({
  goToToday,
  prev,
  next,
  changeView,
  getApi: () => calendarRef.value?.getApi(),
});
</script>

<template>
  <div class="fullcalendar-wrapper">
    <FullCalendar
      ref="calendarRef"
      :options="calendarOptions"
    />
  </div>
</template>

<style lang="scss" scoped>
.fullcalendar-wrapper {
  @apply p-4;
}

/* Стили для FullCalendar */
.fc {
  @apply font-sans;
}

.fc-header-toolbar {
  @apply mb-4 flex flex-wrap items-center justify-between gap-2;
}

.fc-button {
  @apply rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.fc-button-active {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.fc-button-primary:not(:disabled):active,
.fc-button-primary:not(:disabled).fc-button-active {
  @apply bg-blue-600 text-white;
}

.fc-today-button {
  @apply rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50;
}

.fc-toolbar-title {
  @apply text-xl font-semibold text-gray-900;
}

.fc-event {
  @apply cursor-pointer rounded border-none p-1 text-xs;
}

.fc-event-title {
  @apply font-semibold;
}

.fc-event-time {
  @apply mt-0.5 text-[10px] opacity-75;
}

.fc-timegrid-slot {
  @apply h-12;
}

.fc-daygrid-day {
  @apply min-h-[100px];
}

.fc-col-header-cell {
  @apply bg-gray-50 p-2 text-center text-sm font-medium text-gray-700;
}

.fc-timegrid-col {
  @apply border-r border-gray-200;
}

.fc-day-today {
  @apply bg-blue-50;
}
</style>

