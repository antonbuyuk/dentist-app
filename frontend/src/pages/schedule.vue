<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import FullCalendarSchedule from '~/components/scheduler/FullCalendarSchedule.vue'
import AppointmentForm from '~/components/AppointmentForm.vue'
import AppointmentDetails from '~/components/AppointmentDetails.vue'
import { useAppointmentsStore } from '~/store/appointments'
import { useDoctorsStore } from '~/store/doctors'
import { useAuthStore } from '~/store/auth'
import { useScheduleSocket } from '~/composables/useScheduleSocket'
import type { Appointment, CreateAppointmentDto } from '~/types/appointment'

definePageMeta({
  middleware: ['auth', 'role'],
  allowedRoles: ['developer', 'rootUser', 'doctor', 'admin'],
})

const appointmentsStore = useAppointmentsStore();
const doctorsStore = useDoctorsStore();
const authStore = useAuthStore();
const calendarRef = ref<InstanceType<typeof FullCalendarSchedule>>();
const currentDate = ref(new Date());

const { emitUpdate, onUpdated } = useScheduleSocket();

// Фильтры
const selectedDoctorId = ref<string | null>(null);
const selectedStatus = ref<string | null>(null);
const searchQuery = ref('');

// Состояние формы
const isFormOpen = ref(false);
const editingAppointment = ref<Appointment | null>(null);
const formInitialDate = ref<Date | undefined>(undefined);
const formInitialDoctorId = ref<string | undefined>(undefined);

// Состояние модального окна деталей
const isDetailsOpen = ref(false);
const viewingAppointment = ref<Appointment | null>(null);

// Статусы приёмов
const statusOptions = [
  { value: null, label: 'Все статусы' },
  { value: 'scheduled', label: 'Запланирован' },
  { value: 'completed', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
]

// Статистика по приёмам
const appointmentStats = computed(() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Понедельник
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // Для врачей используем отфильтрованные приёмы, для остальных - все
  const appointments = authStore.isDoctor ? filteredAppointments.value : appointmentsStore.appointments

  const isToday = (date: string) => {
    const d = new Date(date)
    return d >= todayStart && d < todayEnd
  }

  const isThisWeek = (date: string) => {
    const d = new Date(date)
    return d >= weekStart && d < weekEnd
  }

  const isThisMonth = (date: string) => {
    const d = new Date(date)
    return d >= monthStart && d < monthEnd
  }

  return {
    total: appointments.length,
    today: appointments.filter((apt) => isToday(apt.startTime)).length,
    thisWeek: appointments.filter((apt) => isThisWeek(apt.startTime)).length,
    thisMonth: appointments.filter((apt) => isThisMonth(apt.startTime)).length,
    scheduled: appointments.filter((apt) => apt.status === 'scheduled').length,
    completed: appointments.filter((apt) => apt.status === 'completed').length,
    cancelled: appointments.filter((apt) => apt.status === 'cancelled').length,
  }
})

// Отфильтрованные appointments
const filteredAppointments = computed(() => {
  let filtered = appointmentsStore.appointments

  // Автоматическая фильтрация для врачей - показываем только их приёмы
  const doctorIdToFilter = authStore.isDoctor && authStore.user?.id
    ? authStore.user.id
    : selectedDoctorId.value

  // Фильтр по врачу
  if (doctorIdToFilter) {
    filtered = filtered.filter(
      (apt) => apt.doctorId === doctorIdToFilter,
    )
  }

  // Фильтр по статусу
  if (selectedStatus.value) {
    filtered = filtered.filter((apt) => apt.status === selectedStatus.value)
  }

  // Поиск по пациенту
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter((apt) => {
      const patientName = apt.patient
        ? `${apt.patient.firstName} ${apt.patient.lastName}`.toLowerCase()
        : ''
      const patientEmail = apt.patient?.email?.toLowerCase() || ''
      const patientPhone = apt.patient?.phone?.toLowerCase() || ''
      const doctorName = apt.doctor
        ? `${apt.doctor.firstName} ${apt.doctor.lastName}`.toLowerCase()
        : ''

      return (
        patientName.includes(query) ||
        patientEmail.includes(query) ||
        patientPhone.includes(query) ||
        doctorName.includes(query) ||
        apt.notes?.toLowerCase().includes(query)
      )
    })
  }

  return filtered
})

// Загружаем все appointments при монтировании
onMounted(async () => {
  await appointmentsStore.fetchAppointments();
  await doctorsStore.fetchDoctors();
});

// Обработчики событий календаря
const handleEventDrop = async (event: { id: string; start: string; end: string }) => {
  try {
    await appointmentsStore.updateAppointment(event.id, {
      startTime: event.start,
      endTime: event.end,
    });
    emitUpdate({ type: 'update', item: { id: event.id, start: event.start, end: event.end } as any });
  } catch (error) {
    console.error('Ошибка при перемещении приёма:', error);
  }
};

const handleEventResize = async (event: { id: string; start: string; end: string }) => {
  try {
    await appointmentsStore.updateAppointment(event.id, {
      startTime: event.start,
      endTime: event.end,
    });
    emitUpdate({ type: 'update', item: { id: event.id, start: event.start, end: event.end } as any });
  } catch (error) {
    console.error('Ошибка при изменении длительности приёма:', error);
  }
};

const handleEventClick = (event: { id: string }) => {
  // Открываем модальное окно с деталями
  const appointment = appointmentsStore.appointments.find((a) => a.id === event.id);
  if (appointment) {
    viewingAppointment.value = appointment;
    isDetailsOpen.value = true;
  }
};

const handleDateClick = (date: Date) => {
  // Открываем форму создания нового приёма
  editingAppointment.value = null;
  formInitialDate.value = date;
  // Для врачей автоматически устанавливаем их ID
  formInitialDoctorId.value = authStore.isDoctor && authStore.user?.id
    ? authStore.user.id
    : undefined;
  isFormOpen.value = true;
};

const handleFormSubmit = async (data: CreateAppointmentDto) => {
  try {
    if (editingAppointment.value) {
      // Обновление существующего appointment
      await appointmentsStore.updateAppointment(editingAppointment.value.id, data);
      emitUpdate({
        type: 'update',
        item: { id: editingAppointment.value.id, ...data } as any,
      });
    } else {
      // Создание нового appointment
      const newAppointment = await appointmentsStore.createAppointment(data);
      emitUpdate({
        type: 'create',
        item: newAppointment as any,
      });
    }
    // Обновляем список appointments
    await appointmentsStore.fetchAppointments();
    // Закрываем форму только при успешном сохранении
    handleFormClose();
  } catch (error) {
    console.error('Ошибка при сохранении приёма:', error);
    // Ошибка обработана в store, форма остается открытой
  }
};

const handleFormClose = () => {
  isFormOpen.value = false;
  editingAppointment.value = null;
  formInitialDate.value = undefined;
  formInitialDoctorId.value = undefined;
};

const handleDetailsClose = () => {
  isDetailsOpen.value = false;
  viewingAppointment.value = null;
};

const handleDetailsEdit = () => {
  if (viewingAppointment.value) {
    editingAppointment.value = viewingAppointment.value;
    formInitialDate.value = undefined;
    formInitialDoctorId.value = undefined;
    isFormOpen.value = true;
  }
};

const handleDetailsDelete = async () => {
  if (!viewingAppointment.value) return;

  try {
    await appointmentsStore.deleteAppointment(viewingAppointment.value.id);
    emitUpdate({
      type: 'delete',
      id: viewingAppointment.value.id,
    });
    // Обновляем список appointments
    await appointmentsStore.fetchAppointments();
    handleDetailsClose();
  } catch (error) {
    console.error('Ошибка при удалении приёма:', error);
    // Ошибка уже обработана в store
  }
};

const handleViewChange = (view: string) => {
  // Вид изменился, но не нужно загружать данные заново
  // так как все appointments уже загружены при монтировании
  console.log('Вид календаря изменен:', view);
};

onUpdated((evt) => {
  if ((evt.type === 'update' || evt.type === 'create' || evt.type === 'delete') && !appointmentsStore.loading) {
    appointmentsStore.fetchAppointments();
  }
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-900">
        Расписание
      </h1>
    </div>

    <div
      v-if="appointmentsStore.loading"
      class="flex items-center justify-center py-12"
    >
      <div class="text-gray-500">
        Загрузка расписания...
      </div>
    </div>

    <div
      v-else-if="appointmentsStore.error"
      class="rounded-lg bg-red-50 p-4 text-red-700"
    >
      <p class="font-medium">
        Ошибка загрузки:
      </p>
      <p>{{ appointmentsStore.error }}</p>
    </div>

    <div v-else>
      <!-- Статистика -->
      <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div class="rounded-lg bg-white p-4 shadow">
          <div class="text-sm text-gray-600">
            Всего
          </div>
          <div class="text-2xl font-bold text-gray-900">
            {{ appointmentStats.total }}
          </div>
        </div>
        <div class="rounded-lg bg-white p-4 shadow">
          <div class="text-sm text-gray-600">
            Сегодня
          </div>
          <div class="text-2xl font-bold text-blue-600">
            {{ appointmentStats.today }}
          </div>
        </div>
        <div class="rounded-lg bg-white p-4 shadow">
          <div class="text-sm text-gray-600">
            Эта неделя
          </div>
          <div class="text-2xl font-bold text-purple-600">
            {{ appointmentStats.thisWeek }}
          </div>
        </div>
        <div class="rounded-lg bg-white p-4 shadow">
          <div class="text-sm text-gray-600">
            Этот месяц
          </div>
          <div class="text-2xl font-bold text-indigo-600">
            {{ appointmentStats.thisMonth }}
          </div>
        </div>
        <div class="rounded-lg bg-white p-4 shadow">
          <div class="text-sm text-gray-600">
            Запланировано
          </div>
          <div class="text-2xl font-bold text-yellow-600">
            {{ appointmentStats.scheduled }}
          </div>
        </div>
        <div class="rounded-lg bg-white p-4 shadow">
          <div class="text-sm text-gray-600">
            Завершено
          </div>
          <div class="text-2xl font-bold text-green-600">
            {{ appointmentStats.completed }}
          </div>
        </div>
        <div class="rounded-lg bg-white p-4 shadow">
          <div class="text-sm text-gray-600">
            Отменено
          </div>
          <div class="text-2xl font-bold text-red-600">
            {{ appointmentStats.cancelled }}
          </div>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="mb-4 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-4 flex-1">
            <!-- Поиск -->
            <div class="flex items-center gap-2 flex-1 min-w-[200px]">
              <label class="text-sm font-medium text-gray-700 whitespace-nowrap">
                Поиск:
              </label>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Поиск по пациенту, врачу, заметкам..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            <!-- Фильтр по врачу (скрыт для врачей, так как они видят только свои приёмы) -->
            <div v-if="!authStore.isDoctor" class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700 whitespace-nowrap">
                Врач:
              </label>
              <select
                v-model="selectedDoctorId"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option :value="null">
                  Все врачи
                </option>
                <option
                  v-for="doctor in doctorsStore.doctors"
                  :key="doctor.id"
                  :value="doctor.id"
                >
                  {{ doctor.firstName }} {{ doctor.lastName }}
                  <template v-if="doctor.specialization">
                    - {{ doctor.specialization }}
                  </template>
                </option>
              </select>
            </div>
            <!-- Информация для врача -->
            <div v-else class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700 whitespace-nowrap">
                Показаны только ваши приёмы
              </span>
            </div>
            <!-- Фильтр по статусу -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700 whitespace-nowrap">
                Статус:
              </label>
              <select
                v-model="selectedStatus"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option
                  v-for="status in statusOptions"
                  :key="status.value || 'all'"
                  :value="status.value"
                >
                  {{ status.label }}
                </option>
              </select>
            </div>
            <!-- Счетчик результатов -->
            <div
              v-if="(selectedDoctorId && !authStore.isDoctor) || selectedStatus || searchQuery || authStore.isDoctor"
              class="text-sm text-gray-600 whitespace-nowrap"
            >
              <template v-if="authStore.isDoctor">
                Показано: {{ filteredAppointments.length }} приёмов
              </template>
              <template v-else>
                Показано: {{ filteredAppointments.length }} из {{ appointmentsStore.appointments.length }}
              </template>
            </div>
          </div>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            @click="handleDateClick(new Date())"
          >
            + Новый приём
          </button>
        </div>
        <!-- Быстрые фильтры -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-gray-700">
            Быстрые фильтры:
          </span>
          <button
            class="px-3 py-1 text-sm rounded-md transition-colors"
            :class="selectedStatus === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="selectedStatus = selectedStatus === 'scheduled' ? null : 'scheduled'"
          >
            Запланированные
          </button>
          <button
            class="px-3 py-1 text-sm rounded-md transition-colors"
            :class="selectedStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="selectedStatus = selectedStatus === 'completed' ? null : 'completed'"
          >
            Завершённые
          </button>
          <button
            class="px-3 py-1 text-sm rounded-md transition-colors"
            :class="selectedStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="selectedStatus = selectedStatus === 'cancelled' ? null : 'cancelled'"
          >
            Отменённые
          </button>
          <button
            v-if="(selectedDoctorId && !authStore.isDoctor) || selectedStatus || searchQuery"
            class="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            @click="selectedDoctorId = null; selectedStatus = null; searchQuery = ''"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
      <FullCalendarSchedule
        ref="calendarRef"
        :appointments="filteredAppointments"
        :initial-date="currentDate"
        @event-click="handleEventClick"
        @event-drop="handleEventDrop"
        @event-resize="handleEventResize"
        @date-click="handleDateClick"
        @view-change="handleViewChange"
      />
    </div>

    <AppointmentForm
      :appointment="editingAppointment"
      :is-open="isFormOpen"
      :initial-date="formInitialDate"
      :initial-doctor-id="formInitialDoctorId"
      @submit="handleFormSubmit"
      @close="handleFormClose"
    />

    <AppointmentDetails
      :appointment="viewingAppointment"
      :is-open="isDetailsOpen"
      @close="handleDetailsClose"
      @edit="handleDetailsEdit"
      @delete="handleDetailsDelete"
    />
  </div>
</template>


