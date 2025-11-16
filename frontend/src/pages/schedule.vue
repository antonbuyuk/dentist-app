<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FullCalendarSchedule from '~/components/scheduler/FullCalendarSchedule.vue';
import { useAppointmentsStore } from '~/store/appointments';
import { useScheduleSocket } from '~/composables/useScheduleSocket';

const appointmentsStore = useAppointmentsStore();
const calendarRef = ref<InstanceType<typeof FullCalendarSchedule>>();
const currentDate = ref(new Date());

const { emitUpdate, onUpdated } = useScheduleSocket();

// Загружаем все appointments при монтировании
onMounted(() => {
  appointmentsStore.fetchAppointments();
});

// Обработчики событий календаря
const handleEventDrop = async (event: { id: string; start: string; end: string }) => {
  try {
    await appointmentsStore.updateAppointment(event.id, {
      startTime: event.start,
      endTime: event.end,
    });
    emitUpdate({ type: 'update', item: { id: event.id, start: event.start, end: event.end } as any });
  } catch (error) {
    console.error('Ошибка при перемещении приёма:', error);
  }
};

const handleEventResize = async (event: { id: string; start: string; end: string }) => {
  try {
    await appointmentsStore.updateAppointment(event.id, {
      startTime: event.start,
      endTime: event.end,
    });
    emitUpdate({ type: 'update', item: { id: event.id, start: event.start, end: event.end } as any });
  } catch (error) {
    console.error('Ошибка при изменении длительности приёма:', error);
  }
};

const handleEventClick = (event: { id: string }) => {
  // Можно открыть модальное окно с деталями приёма
  console.log('Клик по приёму:', event.id);
};

const handleDateClick = (date: Date) => {
  // Можно открыть форму создания нового приёма
  console.log('Клик по дате:', date);
};

const handleViewChange = (view: string) => {
  // Вид изменился, но не нужно загружать данные заново
  // так как все appointments уже загружены при монтировании
  console.log('Вид календаря изменен:', view);
};

onUpdated((evt) => {
  if ((evt.type === 'update' || evt.type === 'create' || evt.type === 'delete') && !appointmentsStore.loading) {
    appointmentsStore.fetchAppointments();
  }
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-900">Расписание</h1>
    </div>

    <div v-if="appointmentsStore.loading" class="flex items-center justify-center py-12">
      <div class="text-gray-500">Загрузка расписания...</div>
    </div>

    <div v-else-if="appointmentsStore.error" class="rounded-lg bg-red-50 p-4 text-red-700">
      <p class="font-medium">Ошибка загрузки:</p>
      <p>{{ appointmentsStore.error }}</p>
    </div>

    <div v-else>
      <FullCalendarSchedule
        ref="calendarRef"
        :appointments="appointmentsStore.appointments"
        :initial-date="currentDate"
        @event-click="handleEventClick"
        @event-drop="handleEventDrop"
        @event-resize="handleEventResize"
        @date-click="handleDateClick"
        @view-change="handleViewChange"
      />
    </div>
  </div>
</template>


