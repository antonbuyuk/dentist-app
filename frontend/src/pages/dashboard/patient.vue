<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '~/store/auth'
import { useAppointmentsStore } from '~/store/appointments'
import { usePatientsStore } from '~/store/patients'
import { useMedicalRecordsStore } from '~/store/medical-records'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'patient',
})

const authStore = useAuthStore()
const appointmentsStore = useAppointmentsStore()
const patientsStore = usePatientsStore()
const medicalRecordsStore = useMedicalRecordsStore()

// Находим пациента по email пользователя
const currentPatient = computed(() => {
  return patientsStore.patients.find(
    (p) => p.email === authStore.user?.email
  )
})

// Приёмы текущего пациента
const myAppointments = computed(() => {
  if (!currentPatient.value) return []
  return appointmentsStore.appointments.filter(
    (apt) => apt.patientId === currentPatient.value?.id
  )
})

// Ближайшие приёмы
const upcomingAppointments = computed(() => {
  const now = new Date()
  return myAppointments.value
    .filter((apt) => new Date(apt.startTime) >= now && apt.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5)
})

onMounted(async () => {
  await Promise.all([
    appointmentsStore.fetchAppointments(),
    patientsStore.fetchPatients(),
    medicalRecordsStore.fetchMedicalRecords({ patientId: authStore.user?.id }),
  ])
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">
        Личный кабинет пациента
      </h1>
      <p class="text-gray-600 mt-2">
        Добро пожаловать,
        {{ currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : authStore.user?.email }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">
          Всего приёмов
        </div>
        <div class="text-3xl font-bold text-blue-600">
          {{ myAppointments.length }}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">
          Ближайшие приёмы
        </div>
        <div class="text-3xl font-bold text-green-600">
          {{ upcomingAppointments.length }}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">
          Завершённых приёмов
        </div>
        <div class="text-3xl font-bold text-purple-600">
          {{ myAppointments.filter(a => a.status === 'completed').length }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">
          Ближайшие приёмы
        </h2>
        <div
          v-if="upcomingAppointments.length === 0"
          class="text-gray-500 text-center py-8"
        >
          Нет предстоящих приёмов
        </div>
        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="apt in upcomingAppointments"
            :key="apt.id"
            class="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">
                  {{ apt.doctor ? `${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Врач не указан' }}
                </div>
                <div class="text-sm text-gray-600 mt-1">
                  {{ new Date(apt.startTime).toLocaleString('ru-RU') }}
                </div>
                <div
                  v-if="apt.doctor?.specialization"
                  class="text-xs text-gray-500 mt-1"
                >
                  {{ apt.doctor.specialization }}
                </div>
              </div>
              <span
                class="px-2 py-1 text-xs rounded"
                :class="{
                  'bg-blue-100 text-blue-800': apt.status === 'scheduled',
                  'bg-green-100 text-green-800': apt.status === 'completed',
                  'bg-red-100 text-red-800': apt.status === 'cancelled',
                }"
              >
                {{ apt.status === 'scheduled' ? 'Запланирован' : apt.status === 'completed' ? 'Завершён' : 'Отменён' }}
              </span>
            </div>
          </div>
        </div>
        <NuxtLink
          to="/schedule"
          class="mt-4 block text-center text-blue-600 hover:text-blue-700"
        >
          Посмотреть все приёмы →
        </NuxtLink>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            Моя информация
          </h2>
          <NuxtLink
            :to="`/patient/${authStore.user?.id || 'me'}`"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Подробнее →
          </NuxtLink>
        </div>
        <div
          v-if="currentPatient"
          class="space-y-3 text-sm"
        >
          <div>
            <span class="text-gray-600">Имя:</span>
            <span class="ml-2 font-medium">
              {{ currentPatient.firstName }} {{ currentPatient.lastName }}
            </span>
          </div>
          <div v-if="currentPatient.email">
            <span class="text-gray-600">Email:</span>
            <span class="ml-2 font-medium">{{ currentPatient.email }}</span>
          </div>
          <div v-if="currentPatient.phone">
            <span class="text-gray-600">Телефон:</span>
            <span class="ml-2 font-medium">{{ currentPatient.phone }}</span>
          </div>
          <div v-if="currentPatient.dateOfBirth">
            <span class="text-gray-600">Дата рождения:</span>
            <span class="ml-2 font-medium">
              {{ new Date(currentPatient.dateOfBirth).toLocaleDateString('ru-RU') }}
            </span>
          </div>
        </div>
        <div
          v-else
          class="text-gray-500 text-center py-8"
        >
          Профиль пациента не найден
        </div>
      </div>
    </div>
  </div>
</template>

