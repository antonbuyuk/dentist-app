<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '~/store/auth'
import { useAppointmentsStore } from '~/store/appointments'
import { usePatientsStore } from '~/store/patients'
import { useDoctorsStore } from '~/store/doctors'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'rootUser',
})

const authStore = useAuthStore()
const appointmentsStore = useAppointmentsStore()
const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()

onMounted(async () => {
  await Promise.all([
    appointmentsStore.fetchAppointments(),
    patientsStore.fetchPatients(),
    doctorsStore.fetchDoctors(),
  ])
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">
        Личный кабинет Root User
      </h1>
      <p class="text-gray-600 mt-2">
        Полный административный доступ к системе
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">
          Всего приёмов
        </div>
        <div class="text-3xl font-bold text-blue-600">
          {{ appointmentsStore.appointments.length }}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">
          Пациентов
        </div>
        <div class="text-3xl font-bold text-green-600">
          {{ patientsStore.patients.length }}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">
          Врачей
        </div>
        <div class="text-3xl font-bold text-purple-600">
          {{ doctorsStore.doctors.length }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">
          Быстрые действия
        </h2>
        <div class="space-y-3">
          <NuxtLink
            to="/schedule"
            class="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="font-medium">
              Расписание
            </div>
            <div class="text-sm text-gray-600">
              Просмотр и управление приёмами
            </div>
          </NuxtLink>

          <NuxtLink
            to="/patients"
            class="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="font-medium">
              Пациенты
            </div>
            <div class="text-sm text-gray-600">
              Управление базой пациентов
            </div>
          </NuxtLink>

          <NuxtLink
            to="/doctors"
            class="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="font-medium">
              Врачи
            </div>
            <div class="text-sm text-gray-600">
              Управление базой врачей
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">
          Профиль
        </h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Роль:</span>
            <span class="font-medium">{{ authStore.user?.role }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Email:</span>
            <span class="font-medium">{{ authStore.user?.email }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

