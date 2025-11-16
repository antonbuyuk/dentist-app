<script setup lang="ts">
import { computed } from 'vue';
import { format, startOfDay, addMinutes, differenceInMinutes, parseISO } from 'date-fns';
import type { Appointment } from '~/types/schedule';

const props = defineProps<{
  date: Date
  appointments: Appointment[]
}>()
const emit = defineEmits<{
  (e: 'move', payload: { id: string; start: string; end: string }): void
}>()

const hours = Array.from({ length: 24 }, (_, h) => h)
const slotHeight = 40

// Получаем приёмы для текущего дня
const dayAppointments = computed(() => {
  return props.appointments.filter((appt) => {
    const apptStart = parseISO(appt.start)
    // Используем локальное сравнение дат
    const apptDate = new Date(apptStart.getFullYear(), apptStart.getMonth(), apptStart.getDate())
    const dayDate = new Date(props.date.getFullYear(), props.date.getMonth(), props.date.getDate())
    return apptDate.getTime() === dayDate.getTime()
  })
})

const onDragStart = (evt: DragEvent, appt: Appointment) => {
  evt.dataTransfer?.setData('text/plain', JSON.stringify(appt))
}

const onDrop = (evt: DragEvent, hour: number) => {
  const text = evt.dataTransfer?.getData('text/plain') || ''
  if (!text) return
  const appt = JSON.parse(text) as Appointment
  const dayStart = startOfDay(props.date)
  const duration = differenceInMinutes(parseISO(appt.end), parseISO(appt.start))
  const newStart = addMinutes(dayStart, hour * 60)
  const newEnd = addMinutes(newStart, duration)
  emit('move', { id: appt.id, start: newStart.toISOString(), end: newEnd.toISOString() })
}

// Вычисляем позицию приёма в пикселях
const getAppointmentStyle = (appt: Appointment) => {
  const start = parseISO(appt.start)
  const end = parseISO(appt.end)

  // Используем локальное время для правильного позиционирования
  const dayStart = new Date(props.date)
  dayStart.setHours(0, 0, 0, 0)

  const startLocal = new Date(start)
  const endLocal = new Date(end)

  // Вычисляем минуты от начала дня в локальном времени
  const minutesFromStart = (startLocal.getHours() * 60 + startLocal.getMinutes()) - (dayStart.getHours() * 60 + dayStart.getMinutes())
  const duration = (endLocal.getTime() - startLocal.getTime()) / (1000 * 60) // в минутах

  return {
    top: `${(minutesFromStart / 60) * slotHeight}px`,
    height: `${(duration / 60) * slotHeight}px`,
  }
}
</script>

<template>
  <div class="border rounded-md overflow-hidden">
    <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
      <div class="font-medium">
        {{ format(date, 'PPP') }}
      </div>
    </div>
    <div class="relative">
      <div
        class="grid"
        :style="{ gridTemplateRows: `repeat(24, ${slotHeight}px)` }"
      >
        <div
          v-for="h in hours"
          :key="h"
          class="border-b text-xs text-gray-500 px-2 flex items-center"
          :data-hour="h"
          @dragover.prevent
          @drop="onDrop($event, h)"
        >
          {{ h.toString().padStart(2, '0') }}:00
        </div>
      </div>
      <div class="absolute inset-0">
        <div
          v-for="appt in dayAppointments"
          :key="appt.id"
          class="absolute left-24 right-2 bg-blue-600/80 text-white text-xs rounded p-2 cursor-move shadow-sm"
          draggable="true"
          :style="getAppointmentStyle(appt)"
          :title="`${appt.patientName}${appt.doctorName ? ` — ${appt.doctorName}` : ''} — ${format(parseISO(appt.start), 'p')}–${format(parseISO(appt.end), 'p')}`"
          @dragstart="onDragStart($event, appt)"
        >
          <div class="font-semibold truncate">
            {{ appt.patientName }}
          </div>
          <div class="opacity-90 text-[10px]">
            {{ format(parseISO(appt.start), 'HH:mm') }}–{{ format(parseISO(appt.end), 'HH:mm') }}
          </div>
          <div
            v-if="appt.doctorName"
            class="opacity-75 text-[10px] mt-0.5 truncate"
          >
            {{ appt.doctorName }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid { grid-template-columns: 6rem 1fr; }
</style>


