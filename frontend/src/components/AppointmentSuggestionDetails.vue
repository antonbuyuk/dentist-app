<script setup lang="ts">
import type { AppointmentSuggestion } from '~/store/appointment-suggestions'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

type Props = {
  suggestion?: AppointmentSuggestion | null
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  suggestion: null,
  isOpen: false,
})

const emit = defineEmits<{
  close: []
  approve: []
  reject: []
}>()

const formatDateTime = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru })
  } catch {
    return dateString
  }
}

const patientName = computed(() => {
  if (!props.suggestion?.patient) return 'Неизвестный пациент'
  const { firstName, lastName } = props.suggestion.patient
  return `${firstName || ''} ${lastName || ''}`.trim() || props.suggestion.patient.email
})

const doctorName = computed(() => {
  if (!props.suggestion?.doctor) return 'Неизвестный врач'
  const { firstName, lastName } = props.suggestion.doctor
  return `${firstName || ''} ${lastName || ''}`.trim() || props.suggestion.doctor.email
})
</script>

<template>
  <div
    v-if="isOpen && suggestion"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <h2 class="text-2xl font-bold text-gray-900">
          Предложение приёма
        </h2>
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors"
          @click="emit('close')"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-6">
        <!-- Статус -->
        <div>
          <span
            class="inline-flex px-3 py-1 text-sm font-semibold rounded-full"
            :class="{
              'bg-yellow-100 text-yellow-800': suggestion.status === 'pending',
              'bg-green-100 text-green-800': suggestion.status === 'approved',
              'bg-red-100 text-red-800': suggestion.status === 'rejected',
            }"
          >
            {{
              suggestion.status === 'pending'
                ? 'Ожидает рассмотрения'
                : suggestion.status === 'approved'
                  ? 'Одобрено'
                  : 'Отклонено'
            }}
          </span>
        </div>

        <!-- Врач -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Врач
          </label>
          <p class="text-gray-900">
            {{ doctorName }}
          </p>
          <p
            v-if="suggestion.doctor?.email"
            class="text-sm text-gray-600"
          >
            {{ suggestion.doctor.email }}
          </p>
        </div>

        <!-- Пациент -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Пациент
          </label>
          <p class="text-gray-900">
            {{ patientName }}
          </p>
          <p
            v-if="suggestion.patient?.email"
            class="text-sm text-gray-600"
          >
            {{ suggestion.patient.email }}
          </p>
        </div>

        <!-- Время начала -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Время начала
          </label>
          <p class="text-gray-900">
            {{ formatDateTime(suggestion.startTime) }}
          </p>
        </div>

        <!-- Время окончания -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Время окончания
          </label>
          <p class="text-gray-900">
            {{ formatDateTime(suggestion.endTime) }}
          </p>
        </div>

        <!-- Рабочее место -->
        <div v-if="suggestion.workplace">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Рабочее место
          </label>
          <p class="text-gray-900">
            {{ suggestion.workplace.name }}
          </p>
        </div>

        <!-- Заметки -->
        <div v-if="suggestion.notes">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Заметки
          </label>
          <p class="text-gray-900 whitespace-pre-wrap">
            {{ suggestion.notes }}
          </p>
        </div>

        <!-- Дата создания -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Дата создания
          </label>
          <p class="text-sm text-gray-600">
            {{ formatDateTime(suggestion.createdAt) }}
          </p>
        </div>

        <!-- Кнопки действий (только для pending) -->
        <div
          v-if="suggestion.status === 'pending'"
          class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200"
        >
          <button
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            @click="emit('close')"
          >
            Отмена
          </button>
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            @click="emit('reject')"
          >
            Отклонить
          </button>
          <button
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            @click="emit('approve')"
          >
            Одобрить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

