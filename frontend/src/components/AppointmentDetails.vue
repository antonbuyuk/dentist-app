<script setup lang="ts">
import type { Appointment } from '~/types/appointment'
import type { MedicalRecord } from '~/types/medical-record'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { useMedicalRecordsStore } from '~/store/medical-records'
import { useAuthStore } from '~/store/auth'
import MedicalRecordView from '~/components/MedicalRecordView.vue'
import MedicalRecordForm from '~/components/MedicalRecordForm.vue'
import MedicalRecordCompact from '~/components/MedicalRecordCompact.vue'

type Props = {
  appointment?: Appointment | null
  isOpen?: boolean
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

const medicalRecordsStore = useMedicalRecordsStore()
const authStore = useAuthStore()

const medicalRecord = ref<MedicalRecord | null>(null)
const isLoadingRecord = ref(false)
const isRecordFormOpen = ref(false)
const isRecordDetailOpen = ref(false)

const canEditRecord = computed(() => {
  if (!props.appointment || !authStore.user) return false
  // Врач может редактировать свои записи, администраторы - все
  return (
    props.appointment.doctorId === authStore.user.id ||
    ['developer', 'rootUser', 'admin'].includes(authStore.user.role)
  )
})

const canCreateRecord = computed(() => {
  if (!props.appointment || !authStore.user) return false
  // Врач может создавать записи для своих приёмов, администраторы - для всех
  return (
    props.appointment.doctorId === authStore.user.id ||
    ['developer', 'rootUser', 'admin'].includes(authStore.user.role)
  )
})

const loadMedicalRecord = async () => {
  if (!props.appointment?.id || !props.isOpen) return
  if (isLoadingRecord.value) return // Предотвращаем дублирование запросов

  isLoadingRecord.value = true
  try {
    await medicalRecordsStore.fetchMedicalRecords({
      appointmentId: props.appointment.id,
    })
    medicalRecord.value = medicalRecordsStore.getRecordByAppointmentId(props.appointment.id) || null
  } catch (error) {
    console.error('Error loading medical record:', error)
  } finally {
    isLoadingRecord.value = false
  }
}

// Объединяем оба watch в один, чтобы избежать дублирования запросов
watch([() => props.appointment?.id, () => props.isOpen], async ([appointmentId, isOpen]) => {
  if (appointmentId && isOpen) {
    await loadMedicalRecord()
  }
}, { immediate: false })

const handleCreateRecord = () => {
  isRecordFormOpen.value = true
}

const handleEditRecord = () => {
  isRecordDetailOpen.value = false
  isRecordFormOpen.value = true
}

const handleRecordClick = () => {
  isRecordDetailOpen.value = true
}

const handleRecordDetailClose = () => {
  isRecordDetailOpen.value = false
}

const handleDeleteRecord = async () => {
  if (!medicalRecord.value) return

  if (confirm('Вы уверены, что хотите удалить эту медицинскую запись?')) {
    try {
      await medicalRecordsStore.deleteMedicalRecord(medicalRecord.value.id)
      medicalRecord.value = null
    } catch (error) {
      console.error('Error deleting medical record:', error)
    }
  }
}

const handleRecordSaved = async (record: MedicalRecord) => {
  medicalRecord.value = record
  isRecordFormOpen.value = false
  // Перезагружаем запись, чтобы получить обновленные данные включая файлы
  await loadMedicalRecord()
}

const handleRecordFormClose = () => {
  isRecordFormOpen.value = false
}

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
            <NuxtLink
              v-if="appointment.patient?.userId || appointment.patientId"
              :to="`/patient/${appointment.patient?.userId || appointment.patientId}`"
              class="text-gray-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer inline-block font-medium"
              @click="emit('close')"
            >
              {{ appointment.patient?.firstName }} {{ appointment.patient?.lastName }}
            </NuxtLink>
            <div
              v-else
              class="text-gray-900"
            >
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

          <!-- Медицинская запись -->
          <div class="pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">
                Медицинская запись
              </h3>
              <div
                v-if="canCreateRecord || canEditRecord"
                class="flex gap-2"
              >
                <button
                  v-if="!medicalRecord && canCreateRecord"
                  type="button"
                  class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  @click="handleCreateRecord"
                >
                  Создать запись
                </button>
              </div>
            </div>

            <div
              v-if="isLoadingRecord"
              class="text-center py-4 text-gray-500"
            >
              Загрузка...
            </div>

            <div v-else-if="medicalRecord">
              <MedicalRecordCompact
                :record="medicalRecord"
                :show-actions="canEditRecord"
                @click="handleRecordClick"
                @edit="handleEditRecord"
                @delete="handleDeleteRecord"
              />
            </div>

            <div
              v-else
              class="text-center py-4 text-gray-500 italic"
            >
              Медицинская запись не создана
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

    <!-- Форма медицинской записи -->
    <MedicalRecordForm
      v-if="isRecordFormOpen && appointment"
      :appointment="appointment"
      :record="medicalRecord"
      @close="handleRecordFormClose"
      @saved="handleRecordSaved"
    />

    <!-- Детальное окно просмотра медицинской записи -->
    <div
      v-if="isRecordDetailOpen && medicalRecord"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 class="text-2xl font-bold text-gray-900">
            Медицинская запись
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="handleRecordDetailClose"
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
        <div class="p-6">
          <MedicalRecordView
            :record="medicalRecord"
            :show-actions="canEditRecord"
            @edit="handleEditRecord"
            @delete="handleDeleteRecord"
          />
        </div>
      </div>
    </div>
  </div>
</template>

