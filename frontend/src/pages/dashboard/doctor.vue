<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Appointment } from '~/types/appointment'
import { useAuthStore } from '~/store/auth'
import { useAppointmentsStore } from '~/store/appointments'
import { useDoctorsStore } from '~/store/doctors'
import TodayAppointmentsWidget from '~/components/widgets/TodayAppointmentsWidget.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'doctor',
})

const authStore = useAuthStore()
const appointmentsStore = useAppointmentsStore()
const doctorsStore = useDoctorsStore()

// Находим врача по email пользователя
const currentDoctor = computed(() => {
  return doctorsStore.doctors.find(
    (d) => d.email === authStore.user?.email
  )
})

// Приёмы текущего врача
const myAppointments = computed(() => {
  if (!currentDoctor.value) return []
  return appointmentsStore.appointments.filter(
    (apt) => apt.doctorId === currentDoctor.value?.id
  )
})

// Ближайшие приёмы
const upcomingAppointments = computed(() => {
  const now = new Date()
  return myAppointments.value
    .filter((apt) => new Date(apt.startTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5)
})

const handleAppointmentClick = (appointment: Appointment) => {
  // Можно открыть детали приёма или перейти к расписанию
  navigateTo(`/schedule?appointmentId=${appointment.id}`)
}

onMounted(async () => {
  await Promise.all([
    appointmentsStore.fetchAppointments(),
    doctorsStore.fetchDoctors(),
  ])
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">
        Личный кабинет врача
      </h1>
      <p class="text-gray-600 mt-2">
        Добро пожаловать,
        {{ currentDoctor ? `${currentDoctor.firstName} ${currentDoctor.lastName}` : authStore.user?.email }}
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
          Специализация
        </div>
        <div class="text-lg font-semibold text-purple-600">
          {{ currentDoctor?.specialization || 'Не указана' }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Виджет "Приёмы сегодня" -->
      <TodayAppointmentsWidget
        :appointments="myAppointments"
        :doctor-id="currentDoctor?.id"
        @appointment-click="handleAppointmentClick"
      />

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

          <div class="p-4 border rounded-lg">
            <div class="font-medium">
              Профиль врача
            </div>
            <div class="text-sm text-gray-600">
              {{ currentDoctor ? `${currentDoctor.firstName} ${currentDoctor.lastName}` : 'Профиль не найден' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

