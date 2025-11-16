<script setup lang="ts">
import type { Appointment } from '~/types/appointment'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const props = defineProps<{
  appointments: Appointment[]
  doctorId?: string
}>()

const emit = defineEmits<{
  appointmentClick: [appointment: Appointment]
}>()

// Фильтруем приёмы на сегодня
const todayAppointments = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return props.appointments
    .filter((apt) => {
      const startDate = new Date(apt.startTime)
      return startDate >= today && startDate < tomorrow
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const formatTime = (dateString: string) => {
  try {
    return format(new Date(dateString), 'HH:mm', { locale: ru })
  } catch {
    return dateString
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Завершён'
    case 'cancelled':
      return 'Отменён'
    case 'scheduled':
      return 'Запланирован'
    default:
      return status
  }
}

const getPatientName = (appointment: Appointment) => {
  if (appointment.patient) {
    const { firstName, lastName } = appointment.patient
    return `${firstName || ''} ${lastName || ''}`.trim() || appointment.patient.email
  }
  return 'Неизвестный пациент'
}
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900">
        Приёмы сегодня
      </h2>
      <span class="text-sm text-gray-500">
        {{ todayAppointments.length }}
      </span>
    </div>

    <div
      v-if="todayAppointments.length === 0"
      class="text-center py-8 text-gray-500"
    >
      <svg
        class="w-12 h-12 mx-auto mb-2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p>На сегодня приёмов нет</p>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="appointment in todayAppointments"
        :key="appointment.id"
        class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
        @click="emit('appointmentClick', appointment)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <div class="text-lg font-semibold text-gray-900">
                {{ formatTime(appointment.startTime) }}
              </div>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getStatusColor(appointment.status)
                ]"
              >
                {{ getStatusLabel(appointment.status) }}
              </span>
            </div>
            <div class="text-sm text-gray-700">
              {{ getPatientName(appointment) }}
            </div>
            <div
              v-if="appointment.notes"
              class="text-xs text-gray-500 mt-1 line-clamp-1"
            >
              {{ appointment.notes }}
            </div>
          </div>
          <div class="text-xs text-gray-400">
            {{ formatTime(appointment.endTime) }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="todayAppointments.length > 0"
      class="mt-4 pt-4 border-t border-gray-200"
    >
      <NuxtLink
        to="/schedule"
        class="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        Перейти к расписанию →
      </NuxtLink>
    </div>
  </div>
</template>

