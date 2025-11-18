<script setup lang="ts">
import { useUsersStore } from '~/store/users'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

type Props = {
  isOpen?: boolean
  initialDate?: Date
}

type Emits = {
  (e: 'close'): void
  (e: 'submit', data: { patientId: string; startTime: string; endTime: string; notes?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  initialDate: undefined,
})

const emit = defineEmits<Emits>()

const usersStore = useUsersStore()

// Фильтруем только пользователей с ролью 'patient'
const patients = computed(() => {
  return usersStore.users.filter((user) => user.role === 'patient')
})

const form = ref({
  patientId: '',
  startTime: '',
  endTime: '',
  notes: '',
})

const isLoading = ref(false)

// Инициализируем форму при открытии
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.initialDate) {
    const date = props.initialDate
    const startHour = date.getHours() || 9
    const startMinute = date.getMinutes() || 0

    const startTime = new Date(date)
    startTime.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + 1) // По умолчанию 1 час

    form.value.startTime = startTime.toISOString()
    form.value.endTime = endTime.toISOString()
  }
})

// Загружаем пациентов при открытии формы
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    try {
      await usersStore.fetchPatients()
    } catch {
      // Если не удалось загрузить пациентов, пробуем загрузить всех пользователей
      // (для администраторов)
      try {
        await usersStore.fetchUsers()
      } catch (err) {
        console.error('Ошибка загрузки пациентов:', err)
      }
    }
  }
})

const formatDateTime = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru })
  } catch {
    return dateString
  }
}

const handleSubmit = async () => {
  if (!form.value.patientId || !form.value.startTime || !form.value.endTime) {
    const { error } = useToast()
    error('Заполните все обязательные поля')
    return
  }

  isLoading.value = true
  try {
    emit('submit', {
      patientId: form.value.patientId,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      notes: form.value.notes || undefined,
    })
  } catch (err) {
    console.error('Ошибка при отправке предложения:', err)
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  form.value = {
    patientId: '',
    startTime: '',
    endTime: '',
    notes: '',
  }
  emit('close')
}

const getPatientName = (patient: any) => {
  const { firstName, lastName } = patient
  return `${firstName || ''} ${lastName || ''}`.trim() || patient.email
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <h2 class="text-2xl font-bold text-gray-900">
          Предложить дату приёма
        </h2>
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors"
          @click="handleClose"
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

      <div class="p-6 space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            <strong>Внимание:</strong> Вы предлагаете дату приёма. Администратор рассмотрит ваше предложение и подтвердит приём.
          </p>
        </div>

        <!-- Пациент -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Пациент <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.patientId"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">
              Выберите пациента
            </option>
            <option
              v-for="patient in patients"
              :key="patient.id"
              :value="patient.id"
            >
              {{ getPatientName(patient) }}
            </option>
          </select>
        </div>

        <!-- Дата и время начала -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Дата и время начала <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.startTime"
            type="datetime-local"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
          <p
            v-if="form.startTime"
            class="mt-1 text-sm text-gray-500"
          >
            {{ formatDateTime(form.startTime) }}
          </p>
        </div>

        <!-- Дата и время окончания -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Дата и время окончания <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.endTime"
            type="datetime-local"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
          <p
            v-if="form.endTime"
            class="mt-1 text-sm text-gray-500"
          >
            {{ formatDateTime(form.endTime) }}
          </p>
        </div>

        <!-- Заметки -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Заметки
          </label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Дополнительная информация о приёме..."
          />
        </div>
      </div>

      <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
        <button
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          @click="handleClose"
        >
          Отмена
        </button>
        <button
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading || !form.patientId || !form.startTime || !form.endTime"
          @click="handleSubmit"
        >
          <span v-if="isLoading">Отправка...</span>
          <span v-else>Отправить предложение</span>
        </button>
      </div>
    </div>
  </div>
</template>

