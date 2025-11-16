<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '~/store/auth'
import { useUsersStore } from '~/store/users'
import { useAppointmentsStore } from '~/store/appointments'
import { useMedicalRecordsStore } from '~/store/medical-records'
import { useToast } from '~/composables/useToast'
import PatientTimeline from '~/components/PatientTimeline.vue'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const appointmentsStore = useAppointmentsStore()
const medicalRecordsStore = useMedicalRecordsStore()

const patientId = computed(() => route.params.id as string)
const isOwnProfile = computed(() => {
  // Если id = 'me' или совпадает с текущим пользователем
  return patientId.value === 'me' || patientId.value === authStore.user?.id
})

const patient = ref<any>(null)
const isLoading = ref(true)
const patientAppointments = ref<any[]>([])
const patientMedicalRecords = ref<any[]>([])

const loadPatientData = async () => {
  isLoading.value = true
  try {
    // Загружаем данные пациента
    let userId = patientId.value
    if (userId === 'me') {
      userId = authStore.user?.id || ''
    }

    // Загружаем пользователя
    const user = await usersStore.fetchUser(userId)
    patient.value = user

    // Загружаем приёмы пациента
    await appointmentsStore.fetchAppointments()
    patientAppointments.value = appointmentsStore.appointments.filter(
      (apt) => apt.patientId === userId || apt.patient?.userId === userId
    )

    // Загружаем медицинские записи
    await medicalRecordsStore.fetchMedicalRecords({ patientId: userId })
    patientMedicalRecords.value = medicalRecordsStore.medicalRecords
  } catch (error) {
    console.error('Error loading patient data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadPatientData()
})

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Не указано'
  try {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru })
  } catch {
    return dateString
  }
}

const patientName = computed(() => {
  if (!patient.value) return 'Загрузка...'
  const { firstName, lastName } = patient.value
  return `${firstName || ''} ${lastName || ''}`.trim() || patient.value.email || 'Неизвестный пациент'
})
</script>

<template>
  <div class="p-6">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-gray-500">Загрузка...</div>
    </div>

    <div v-else-if="patient" class="max-w-6xl mx-auto">
      <!-- Заголовок -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Профиль пациента
        </h1>
        <p class="text-gray-600">
          {{ patientName }}
        </p>
      </div>

      <!-- Информация о пациенте -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          Личные данные
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-600">Имя:</span>
            <p class="font-medium text-gray-900">
              {{ patient.firstName || 'Не указано' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Фамилия:</span>
            <p class="font-medium text-gray-900">
              {{ patient.lastName || 'Не указано' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Email:</span>
            <p class="font-medium text-gray-900">
              {{ patient.email }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Телефон:</span>
            <p class="font-medium text-gray-900">
              {{ patient.phone || 'Не указано' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Дата рождения:</span>
            <p class="font-medium text-gray-900">
              {{ formatDate(patient.dateOfBirth) }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Адрес:</span>
            <p class="font-medium text-gray-900">
              {{ patient.address || 'Не указано' }}
            </p>
          </div>
        </div>

        <div
          v-if="patient.medicalHistory"
          class="mt-6 pt-6 border-t border-gray-200"
        >
          <span class="text-sm text-gray-600">История болезней:</span>
          <p class="mt-2 text-gray-900 whitespace-pre-wrap">
            {{ patient.medicalHistory }}
          </p>
        </div>
      </div>

      <!-- Статистика -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">
            Всего приёмов
          </div>
          <div class="text-3xl font-bold text-blue-600">
            {{ patientAppointments.length }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">
            Завершённых приёмов
          </div>
          <div class="text-3xl font-bold text-green-600">
            {{ patientAppointments.filter(a => a.status === 'completed').length }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">
            Медицинских записей
          </div>
          <div class="text-3xl font-bold text-purple-600">
            {{ patientMedicalRecords.length }}
          </div>
        </div>
      </div>

      <!-- Таймлайн -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          История лечения
        </h2>
        <PatientTimeline
          :appointments="patientAppointments"
          :medical-records="patientMedicalRecords"
        />
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-red-600">Пациент не найден</div>
    </div>
  </div>
</template>

