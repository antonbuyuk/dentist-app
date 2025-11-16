<script setup lang="ts">
import type { Appointment } from '~/types/appointment'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'

type Props = {
  appointment: Appointment | null
  isOpen: boolean
}

type Emits = {
  (e: 'close'): void
  (e: 'edit'): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  appointment: null,
  isOpen: false,
})

const emit = defineEmits<Emits>()

const handleEdit = () => {
  emit('edit')
  emit('close')
}

const handleDelete = async () => {
  if (confirm('Вы уверены, что хотите удалить этот приём?')) {
    emit('delete')
    emit('close')
  }
}

const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru })
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    scheduled: 'Запланирован',
    completed: 'Завершён',
    cancelled: 'Отменён',
  }
  return statusMap[status] || status
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}
</script>

<template>
  <div
    v-if="isOpen && appointment"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">
            Детали приёма
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 text-2xl"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <div class="space-y-4">
          <!-- Статус -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <span
              class="inline-block px-3 py-1 rounded-full text-sm font-medium"
              :class="getStatusColor(appointment.status)"
            >
              {{ getStatusLabel(appointment.status) }}
            </span>
          </div>

          <!-- Пациент -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Пациент
            </label>
            <div class="text-gray-900">
              {{ appointment.patient?.firstName }} {{ appointment.patient?.lastName }}
            </div>
            <div
              v-if="appointment.patient?.phone"
              class="text-sm text-gray-600 mt-1"
            >
              Телефон: {{ appointment.patient.phone }}
            </div>
            <div
              v-if="appointment.patient?.email"
              class="text-sm text-gray-600"
            >
              Email: {{ appointment.patient.email }}
            </div>
          </div>

          <!-- Врач -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Врач
            </label>
            <div class="text-gray-900">
              {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}
            </div>
            <div
              v-if="appointment.doctor?.specialization"
              class="text-sm text-gray-600 mt-1"
            >
              Специализация: {{ appointment.doctor.specialization }}
            </div>
          </div>

          <!-- Время -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Начало приёма
              </label>
              <div class="text-gray-900">
                {{ formatDateTime(appointment.startTime) }}
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Окончание приёма
              </label>
              <div class="text-gray-900">
                {{ formatDateTime(appointment.endTime) }}
              </div>
            </div>
          </div>

          <!-- Длительность -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Длительность
            </label>
            <div class="text-gray-900">
              {{
                Math.round(
                  (new Date(appointment.endTime).getTime() -
                    new Date(appointment.startTime).getTime()) /
                    (1000 * 60)
                )
              }}
              минут
            </div>
          </div>

          <!-- Заметки -->
          <div v-if="appointment.notes">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Заметки
            </label>
            <div class="text-gray-900 whitespace-pre-wrap">
              {{ appointment.notes }}
            </div>
          </div>

          <!-- Даты создания и обновления -->
          <div class="pt-4 border-t border-gray-200">
            <div class="text-xs text-gray-500">
              <div>
                Создано: {{ formatDateTime(appointment.createdAt) }}
              </div>
              <div v-if="appointment.updatedAt !== appointment.createdAt">
                Обновлено: {{ formatDateTime(appointment.updatedAt) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Действия -->
        <div class="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            @click="emit('close')"
          >
            Закрыть
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            @click="handleDelete"
          >
            Удалить
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            @click="handleEdit"
          >
            Редактировать
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

