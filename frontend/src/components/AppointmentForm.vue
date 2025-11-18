<script setup lang="ts">
import type { Appointment, CreateAppointmentDto } from '~/types/appointment'
import { useUsersStore } from '~/store/users'
import { useDoctorsStore } from '~/store/doctors'
import { computed } from 'vue'

type Props = {
  appointment?: Appointment | null
  isOpen: boolean
  initialDate?: Date
  initialDoctorId?: string
}

type Emits = {
  (e: 'close'): void
  (e: 'submit', data: CreateAppointmentDto): void
}

const props = withDefaults(defineProps<Props>(), {
  appointment: null,
  isOpen: false,
  initialDate: undefined,
  initialDoctorId: undefined,
})

const emit = defineEmits<Emits>()

const usersStore = useUsersStore()
const doctorsStore = useDoctorsStore()

// Фильтруем только пользователей с ролью 'patient'
const patients = computed(() => {
  return usersStore.users.filter((user) => user.role === 'patient')
})

// Фильтруем только пользователей с ролью 'doctor'
const doctors = computed(() => {
  return usersStore.users.filter((user) => user.role === 'doctor')
})

const form = ref<CreateAppointmentDto>({
  patientId: '',
  doctorId: '',
  startTime: '',
  endTime: '',
  notes: '',
  status: 'scheduled',
  recurrenceRule: undefined,
  recurrenceEndDate: undefined,
})

const isRecurring = ref(false)

const errors = ref<Partial<Record<keyof CreateAppointmentDto, string>>>({})
const apiError = ref<string | null>(null)

// Загружаем данные при открытии формы
watch(() => props.isOpen, async (open) => {
  if (open) {
    if (usersStore.users.length === 0) {
      try {
        // Сначала пробуем загрузить пациентов (для врачей)
        await usersStore.fetchPatients()
      } catch (error) {
        // Если не удалось, загружаем всех пользователей (для администраторов)
        try {
          await usersStore.fetchUsers()
        } catch (err) {
          console.error('Ошибка загрузки пользователей:', err)
        }
      }
    }
    resetForm()
  }
})

const resetForm = () => {
  if (props.appointment) {
    // Редактирование существующего appointment
    const startDate = new Date(props.appointment.startTime)
    const endDate = new Date(props.appointment.endTime)

    // Используем userId из связанных patient и doctor, если они есть
    // Иначе используем patientId и doctorId напрямую (для обратной совместимости)
    const patientUserId = props.appointment.patient?.userId || props.appointment.patientId
    const doctorUserId = props.appointment.doctor?.userId || props.appointment.doctorId

    form.value = {
      patientId: patientUserId,
      doctorId: doctorUserId,
      startTime: formatDateTimeLocal(startDate),
      endTime: formatDateTimeLocal(endDate),
      notes: props.appointment.notes || '',
      status: props.appointment.status || 'scheduled',
      recurrenceRule: props.appointment.recurrenceRule,
      recurrenceEndDate: props.appointment.recurrenceEndDate
        ? formatDateTimeLocal(new Date(props.appointment.recurrenceEndDate))
        : undefined,
    }
    isRecurring.value = !!props.appointment.recurrenceRule
  } else {
    // Создание нового appointment
    const startDate = props.initialDate ? new Date(props.initialDate) : new Date()
    // Устанавливаем время на ближайший час, округленный до 30 минут
    startDate.setMinutes(Math.ceil(startDate.getMinutes() / 30) * 30)
    startDate.setSeconds(0)
    startDate.setMilliseconds(0)

    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 1) // По умолчанию 1 час

    form.value = {
      patientId: '',
      doctorId: props.initialDoctorId || '',
      startTime: formatDateTimeLocal(startDate),
      endTime: formatDateTimeLocal(endDate),
      notes: '',
      status: 'scheduled',
      recurrenceRule: undefined,
      recurrenceEndDate: undefined,
    }
    isRecurring.value = false
  }
  errors.value = {}
  apiError.value = null
}

const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.patientId) {
    errors.value.patientId = 'Выберите пациента'
  }

  if (!form.value.doctorId) {
    errors.value.doctorId = 'Выберите врача'
  }

  if (!form.value.startTime) {
    errors.value.startTime = 'Укажите время начала'
  }

  if (!form.value.endTime) {
    errors.value.endTime = 'Укажите время окончания'
  }

  if (form.value.startTime && form.value.endTime) {
    const start = new Date(form.value.startTime)
    const end = new Date(form.value.endTime)

    if (end <= start) {
      errors.value.endTime = 'Время окончания должно быть позже времени начала'
    }

    // Проверка на минимальную длительность (15 минут)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    if (durationMinutes < 15) {
      errors.value.endTime = 'Минимальная длительность приёма - 15 минут'
    }
  }

  // Валидация повторения
  if (isRecurring.value) {
    if (!form.value.recurrenceRule) {
      errors.value.recurrenceRule = 'Выберите тип повторения'
    }

    if (!form.value.recurrenceEndDate) {
      errors.value.recurrenceEndDate = 'Укажите дату окончания повторения'
    } else {
      const endDate = new Date(form.value.recurrenceEndDate)
      const startDate = form.value.startTime
        ? new Date(form.value.startTime)
        : null

      if (startDate && endDate <= startDate) {
        errors.value.recurrenceEndDate =
          'Дата окончания должна быть позже даты начала'
      }
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validate()) return

  apiError.value = null

  // Преобразуем локальное время в ISO строку
  const submitData: CreateAppointmentDto = {
    ...form.value,
    startTime: new Date(form.value.startTime).toISOString(),
    endTime: new Date(form.value.endTime).toISOString(),
    // Если повторение не включено, удаляем поля повторения
    recurrenceRule: isRecurring.value ? form.value.recurrenceRule : undefined,
    recurrenceEndDate: isRecurring.value && form.value.recurrenceEndDate
      ? new Date(form.value.recurrenceEndDate).toISOString()
      : undefined,
  }

  emit('submit', submitData)
}

const handleClose = () => {
  resetForm()
  emit('close')
}

watch(() => props.appointment, () => {
  if (props.isOpen) {
    resetForm()
  }
}, { immediate: true })
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">
            {{ appointment ? 'Редактировать приём' : 'Новый приём' }}
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 text-2xl"
            @click="handleClose"
          >
            ×
          </button>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Пациент <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.patientId"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.patientId }"
              >
                <option value="">
                  Выберите пациента
                </option>
                <option
                  v-for="patient in patients"
                  :key="patient.id"
                  :value="patient.id"
                >
                  {{ patient.firstName || '' }} {{ patient.lastName || '' }}
                  <template v-if="patient.email">
                    ({{ patient.email }})
                  </template>
                </option>
              </select>
              <p
                v-if="errors.patientId"
                class="text-red-500 text-sm mt-1"
              >
                {{ errors.patientId }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Врач <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.doctorId"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.doctorId }"
              >
                <option value="">
                  Выберите врача
                </option>
                <option
                  v-for="doctor in doctors"
                  :key="doctor.id"
                  :value="doctor.id"
                >
                  {{ doctor.firstName || '' }} {{ doctor.lastName || '' }}
                  <template v-if="doctor.email">
                    ({{ doctor.email }})
                  </template>
                </option>
              </select>
              <p
                v-if="errors.doctorId"
                class="text-red-500 text-sm mt-1"
              >
                {{ errors.doctorId }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Начало приёма <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.startTime"
                type="datetime-local"
                step="1800"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.startTime }"
              >
              <p
                v-if="errors.startTime"
                class="text-red-500 text-sm mt-1"
              >
                {{ errors.startTime }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Окончание приёма <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.endTime"
                type="datetime-local"
                step="1800"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.endTime }"
              >
              <p
                v-if="errors.endTime"
                class="text-red-500 text-sm mt-1"
              >
                {{ errors.endTime }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">
                Запланирован
              </option>
              <option value="completed">
                Завершён
              </option>
              <option value="cancelled">
                Отменён
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Заметки
            </label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Дополнительная информация о приёме"
            />
          </div>

          <!-- Повторяющийся приём -->
          <div class="border-t pt-4">
            <div class="flex items-center mb-4">
              <input
                id="recurring"
                v-model="isRecurring"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              >
              <label
                for="recurring"
                class="ml-2 block text-sm font-medium text-gray-700"
              >
                Повторяющийся приём
              </label>
            </div>

            <div
              v-if="isRecurring"
              class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-6 border-l-2 border-blue-200"
            >
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Тип повторения <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.recurrenceRule"
                  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="{ 'border-red-500': errors.recurrenceRule }"
                >
                  <option value="">
                    Выберите тип
                  </option>
                  <option value="daily">
                    Ежедневно
                  </option>
                  <option value="weekly">
                    Еженедельно
                  </option>
                  <option value="monthly">
                    Ежемесячно
                  </option>
                </select>
                <p
                  v-if="errors.recurrenceRule"
                  class="text-red-500 text-sm mt-1"
                >
                  {{ errors.recurrenceRule }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Дата окончания повторения <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.recurrenceEndDate"
                  type="date"
                  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="{ 'border-red-500': errors.recurrenceEndDate }"
                  :min="form.startTime ? form.startTime.split('T')[0] : undefined"
                >
                <p
                  v-if="errors.recurrenceEndDate"
                  class="text-red-500 text-sm mt-1"
                >
                  {{ errors.recurrenceEndDate }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="apiError"
            class="rounded-lg bg-red-50 p-3 text-red-700"
          >
            <p class="text-sm">
              {{ apiError }}
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              @click="handleClose"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {{ appointment ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

