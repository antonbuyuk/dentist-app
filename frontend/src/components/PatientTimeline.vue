<script setup lang="ts">
import type { Appointment } from '~/types/appointment'
import type { MedicalRecord } from '~/types/medical-record'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

type TimelineItem = {
  id: string
  type: 'appointment' | 'medical_record'
  date: Date
  appointment?: Appointment
  medicalRecord?: MedicalRecord
}

const props = defineProps<{
  appointments: Appointment[]
  medicalRecords: MedicalRecord[]
}>()

// Объединяем приёмы и медицинские записи в один таймлайн
const timelineItems = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = []

  // Добавляем приёмы
  props.appointments.forEach((apt) => {
    items.push({
      id: apt.id,
      type: 'appointment',
      date: new Date(apt.startTime),
      appointment: apt,
    })
  })

  // Добавляем медицинские записи
  props.medicalRecords.forEach((record) => {
    items.push({
      id: record.id,
      type: 'medical_record',
      date: new Date(record.createdAt),
      medicalRecord: record,
    })
  })

  // Сортируем по дате (от новых к старым)
  return items.sort((a, b) => b.date.getTime() - a.date.getTime())
})

const formatDate = (date: Date) => {
  try {
    return format(date, 'dd MMMM yyyy', { locale: ru })
  } catch {
    return date.toLocaleDateString('ru-RU')
  }
}

const formatTime = (date: Date) => {
  try {
    return format(date, 'HH:mm', { locale: ru })
  } catch {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
}

const getDoctorName = (appointment: Appointment) => {
  if (appointment.doctor) {
    const { firstName, lastName } = appointment.doctor
    return `${firstName || ''} ${lastName || ''}`.trim() || appointment.doctor.email
  }
  return 'Неизвестный врач'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
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
</script>

<template>
  <div class="relative">
    <!-- Вертикальная линия таймлайна -->
    <div
      class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"
      :style="{ height: timelineItems.length > 0 ? '100%' : '0' }"
    />

    <div class="space-y-8">
      <div
        v-for="(item, index) in timelineItems"
        :key="item.id"
        class="relative flex gap-6"
      >
        <!-- Точка на таймлайне -->
        <div class="relative z-10 flex-shrink-0">
          <div
            :class="[
              'w-16 h-16 rounded-full border-4 flex items-center justify-center',
              item.type === 'appointment'
                ? 'bg-blue-50 border-blue-300'
                : 'bg-green-50 border-green-300'
            ]"
          >
            <svg
              v-if="item.type === 'appointment'"
              class="w-6 h-6 text-blue-600"
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
            <svg
              v-else
              class="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>

        <!-- Контент -->
        <div class="flex-1 pb-8">
          <!-- Дата -->
          <div class="text-sm font-medium text-gray-500 mb-2">
            {{ formatDate(item.date) }}
          </div>

          <!-- Приём -->
          <div
            v-if="item.type === 'appointment' && item.appointment"
            class="bg-white border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            :class="getStatusColor(item.appointment.status)"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="text-lg font-semibold text-gray-900 mb-1">
                  Приём у врача
                </div>
                <div class="text-sm text-gray-700">
                  {{ formatTime(new Date(item.appointment.startTime)) }} - {{ formatTime(new Date(item.appointment.endTime)) }}
                </div>
              </div>
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getStatusColor(item.appointment.status)"
              >
                {{ getStatusLabel(item.appointment.status) }}
              </span>
            </div>

            <div class="space-y-1 text-sm text-gray-700">
              <div>
                <span class="font-medium">Врач:</span>
                {{ getDoctorName(item.appointment) }}
              </div>
              <div
                v-if="item.appointment.notes"
                class="text-gray-600 italic"
              >
                {{ item.appointment.notes }}
              </div>
            </div>
          </div>

          <!-- Медицинская запись -->
          <div
            v-if="item.type === 'medical_record' && item.medicalRecord"
            class="bg-white border-2 border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="text-lg font-semibold text-gray-900 mb-2">
              Медицинская запись
            </div>

            <div class="space-y-2 text-sm text-gray-700">
              <div
                v-if="item.medicalRecord.doctor"
                class="flex items-center gap-2"
              >
                <span class="font-medium">Врач:</span>
                <span>
                  {{ item.medicalRecord.doctor.firstName }} {{ item.medicalRecord.doctor.lastName }}
                </span>
              </div>

              <div
                v-if="item.medicalRecord.createdBy"
                class="flex items-center gap-2 text-gray-600"
              >
                <span class="font-medium">Заполнил:</span>
                <span>
                  {{ item.medicalRecord.createdBy.firstName }} {{ item.medicalRecord.createdBy.lastName }}
                </span>
              </div>

              <div
                v-if="item.medicalRecord.diagnosis"
                class="mt-3"
              >
                <span class="font-medium text-gray-900">Диагноз:</span>
                <p class="text-gray-700 whitespace-pre-wrap">
                  {{ item.medicalRecord.diagnosis }}
                </p>
              </div>

              <div
                v-if="item.medicalRecord.treatment"
                class="mt-2"
              >
                <span class="font-medium text-gray-900">Лечение:</span>
                <p class="text-gray-700 whitespace-pre-wrap">
                  {{ item.medicalRecord.treatment }}
                </p>
              </div>

              <div
                v-if="item.medicalRecord.notes"
                class="mt-2"
              >
                <span class="font-medium text-gray-900">Заметки:</span>
                <p class="text-gray-700 whitespace-pre-wrap">
                  {{ item.medicalRecord.notes }}
                </p>
              </div>

              <div
                v-if="item.medicalRecord.recommendations"
                class="mt-2"
              >
                <span class="font-medium text-gray-900">Рекомендации:</span>
                <p class="text-gray-700 whitespace-pre-wrap">
                  {{ item.medicalRecord.recommendations }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="timelineItems.length === 0"
        class="text-center py-12 text-gray-500"
      >
        <svg
          class="w-16 h-16 mx-auto mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>История пуста</p>
      </div>
    </div>
  </div>
</template>

