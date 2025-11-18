<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '~/store/auth'
import { useUsersStore } from '~/store/users'
import { useAppointmentsStore } from '~/store/appointments'
import { useMedicalRecordsStore } from '~/store/medical-records'
import { useWorkplacesStore } from '~/store/workplaces'
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
const workplacesStore = useWorkplacesStore()

const doctorId = computed(() => route.params.id as string)
const isOwnProfile = computed(() => {
  // Если id = 'me' или совпадает с текущим пользователем
  return doctorId.value === 'me' || doctorId.value === authStore.user?.id
})

const doctor = ref<any>(null)
const isLoading = ref(true)
const doctorAppointments = ref<any[]>([])
const doctorMedicalRecords = ref<any[]>([])
const doctorWorkplaces = ref<any[]>([])

const loadDoctorData = async () => {
  isLoading.value = true
  try {
    // Загружаем данные врача
    let userId = doctorId.value
    if (userId === 'me') {
      userId = authStore.user?.id || ''
    }

    // Загружаем пользователя
    const user = await usersStore.fetchUser(userId)
    doctor.value = user

    // Загружаем приёмы врача
    await appointmentsStore.fetchAppointments()
    doctorAppointments.value = appointmentsStore.appointments.filter(
      (apt) => apt.doctorId === userId || apt.doctor?.userId === userId
    )

    // Загружаем медицинские записи врача
    await medicalRecordsStore.fetchMedicalRecords({ doctorId: userId })
    doctorMedicalRecords.value = medicalRecordsStore.medicalRecords

    // Загружаем рабочие места врача
    await workplacesStore.fetchWorkplaces()
    // Фильтруем рабочие места, связанные с врачом
    // Рабочие места загружаются с информацией о врачах через API
    doctorWorkplaces.value = workplacesStore.workplaces.filter((wp: any) => {
      // Проверяем, есть ли связь с врачом через doctors массив
      return wp.doctors?.some((d: any) => d.doctorId === userId || d.doctor?.id === userId) || false
    })
  } catch (error) {
    console.error('Error loading doctor data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDoctorData()
})

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Не указано'
  try {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru })
  } catch {
    return dateString
  }
}

const doctorName = computed(() => {
  if (!doctor.value) return 'Загрузка...'
  const { firstName, lastName } = doctor.value
  return `${firstName || ''} ${lastName || ''}`.trim() || doctor.value.email || 'Неизвестный врач'
})

// Статистика по приёмам
const appointmentStats = computed(() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const isToday = (date: string) => {
    const d = new Date(date)
    return d >= todayStart && d < todayEnd
  }

  return {
    total: doctorAppointments.value.length,
    today: doctorAppointments.value.filter((apt) => isToday(apt.startTime)).length,
    scheduled: doctorAppointments.value.filter((apt) => apt.status === 'scheduled').length,
    completed: doctorAppointments.value.filter((apt) => apt.status === 'completed').length,
    cancelled: doctorAppointments.value.filter((apt) => apt.status === 'cancelled').length,
  }
})
</script>

<template>
  <div class="p-6">
    <div
      v-if="isLoading"
      class="text-center py-12"
    >
      <div class="text-gray-500">
        Загрузка...
      </div>
    </div>

    <div
      v-else-if="doctor"
      class="max-w-6xl mx-auto"
    >
      <!-- Заголовок -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Профиль врача
        </h1>
        <p class="text-gray-600">
          {{ doctorName }}
        </p>
      </div>

      <!-- Информация о враче -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          Личные данные
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-600">Имя:</span>
            <p class="font-medium text-gray-900">
              {{ doctor.firstName || 'Не указано' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Фамилия:</span>
            <p class="font-medium text-gray-900">
              {{ doctor.lastName || 'Не указано' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Email:</span>
            <p class="font-medium text-gray-900">
              {{ doctor.email }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Телефон:</span>
            <p class="font-medium text-gray-900">
              {{ doctor.phone || 'Не указано' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Дата рождения:</span>
            <p class="font-medium text-gray-900">
              {{ formatDate(doctor.dateOfBirth) }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Адрес:</span>
            <p class="font-medium text-gray-900">
              {{ doctor.address || 'Не указано' }}
            </p>
          </div>
        </div>

        <div
          v-if="doctor.medicalHistory"
          class="mt-6 pt-6 border-t border-gray-200"
        >
          <span class="text-sm text-gray-600">Медицинская информация:</span>
          <p class="mt-2 text-gray-900 whitespace-pre-wrap">
            {{ doctor.medicalHistory }}
          </p>
        </div>
      </div>

      <!-- Статистика -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">
            Всего приёмов
          </div>
          <div class="text-3xl font-bold text-blue-600">
            {{ appointmentStats.total }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">
            Приёмов сегодня
          </div>
          <div class="text-3xl font-bold text-green-600">
            {{ appointmentStats.today }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">
            Запланированных
          </div>
          <div class="text-3xl font-bold text-yellow-600">
            {{ appointmentStats.scheduled }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">
            Завершённых
          </div>
          <div class="text-3xl font-bold text-green-600">
            {{ appointmentStats.completed }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">
            Медицинских записей
          </div>
          <div class="text-3xl font-bold text-purple-600">
            {{ doctorMedicalRecords.length }}
          </div>
        </div>
      </div>

      <!-- Рабочие места -->
      <div
        v-if="doctorWorkplaces.length > 0"
        class="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          Рабочие места
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="workplace in doctorWorkplaces"
            :key="workplace.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h3 class="font-semibold text-gray-900 mb-2">
              {{ workplace.name }}
            </h3>
            <p
              v-if="workplace.description"
              class="text-sm text-gray-600 mb-2"
            >
              {{ workplace.description }}
            </p>
            <div
              v-if="workplace.location"
              class="text-sm text-gray-500"
            >
              📍 {{ workplace.location }}
            </div>
            <div
              v-if="workplace.type"
              class="text-sm text-gray-500 mt-1"
            >
              Тип: {{ workplace.type }}
            </div>
          </div>
        </div>
      </div>

      <!-- Список приёмов -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          Приёмы
        </h2>
        <div
          v-if="doctorAppointments.length === 0"
          class="text-center py-8 text-gray-500"
        >
          Нет приёмов
        </div>
        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="appointment in doctorAppointments.slice().sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())"
            :key="appointment.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="font-semibold text-gray-900">
                    {{ format(new Date(appointment.startTime), 'dd MMMM yyyy, HH:mm', { locale: ru }) }}
                  </h3>
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-blue-100 text-blue-800': appointment.status === 'scheduled',
                      'bg-green-100 text-green-800': appointment.status === 'completed',
                      'bg-red-100 text-red-800': appointment.status === 'cancelled',
                    }"
                  >
                    {{
                      appointment.status === 'scheduled'
                        ? 'Запланирован'
                        : appointment.status === 'completed'
                          ? 'Завершён'
                          : 'Отменён'
                    }}
                  </span>
                </div>
                <div class="text-sm text-gray-600 mb-1">
                  <span class="font-medium">Пациент:</span>
                  <NuxtLink
                    v-if="appointment.patient?.userId || appointment.patientId"
                    :to="`/patient/${appointment.patient?.userId || appointment.patientId}`"
                    class="text-blue-600 hover:text-blue-800 hover:underline ml-1"
                  >
                    {{ appointment.patient?.firstName }} {{ appointment.patient?.lastName }}
                  </NuxtLink>
                  <span
                    v-else
                    class="ml-1"
                  >
                    {{ appointment.patient?.firstName }} {{ appointment.patient?.lastName }}
                  </span>
                </div>
                <div
                  v-if="appointment.workplace"
                  class="text-sm text-gray-600 mb-1"
                >
                  <span class="font-medium">Рабочее место:</span>
                  <span class="ml-1">{{ appointment.workplace.name }}</span>
                </div>
                <div
                  v-if="appointment.notes"
                  class="text-sm text-gray-600 mt-2"
                >
                  <span class="font-medium">Заметки:</span>
                  <span class="ml-1">{{ appointment.notes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="text-center py-12"
    >
      <div class="text-red-600">
        Врач не найден
      </div>
    </div>
  </div>
</template>

