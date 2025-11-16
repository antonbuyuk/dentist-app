<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '~/store/auth'
import { useAppointmentsStore } from '~/store/appointments'
import { usePatientsStore } from '~/store/patients'
import { useDoctorsStore } from '~/store/doctors'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin',
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
        Панель администратора
      </h1>
      <p class="text-gray-600 mt-2">
        Управление системой и пользователями
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">
          Пользователей
        </div>
        <div class="text-3xl font-bold text-orange-600">
          -
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <NuxtLink
        to="/users"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      >
        <h2 class="text-xl font-semibold mb-2">
          Пользователи
        </h2>
        <p class="text-gray-600 text-sm">
          Управление пользователями и назначение ролей
        </p>
      </NuxtLink>

      <NuxtLink
        to="/schedule"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      >
        <h2 class="text-xl font-semibold mb-2">
          Расписание
        </h2>
        <p class="text-gray-600 text-sm">
          Управление приёмами и расписанием
        </p>
      </NuxtLink>

      <NuxtLink
        to="/patients"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      >
        <h2 class="text-xl font-semibold mb-2">
          Пациенты
        </h2>
        <p class="text-gray-600 text-sm">
          Управление базой пациентов
        </p>
      </NuxtLink>

      <NuxtLink
        to="/doctors"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      >
        <h2 class="text-xl font-semibold mb-2">
          Врачи
        </h2>
        <p class="text-gray-600 text-sm">
          Управление базой врачей
        </p>
      </NuxtLink>
    </div>
  </div>
</template>

