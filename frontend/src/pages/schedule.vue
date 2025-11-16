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
const calendarRef = ref<InstanceType<typeof FullCalendarSchedule>>();
const currentDate = ref(new Date());

const { emitUpdate, onUpdated } = useScheduleSocket();

// Фильтр по врачам
const selectedDoctorId = ref<string | null>(null);

// Состояние формы
const isFormOpen = ref(false);
const editingAppointment = ref<Appointment | null>(null);
const formInitialDate = ref<Date | undefined>(undefined);
const formInitialDoctorId = ref<string | undefined>(undefined);

// Состояние модального окна деталей
const isDetailsOpen = ref(false);
const viewingAppointment = ref<Appointment | null>(null);

// Отфильтрованные appointments
const filteredAppointments = computed(() => {
  if (!selectedDoctorId.value) {
    return appointmentsStore.appointments;
  }
  return appointmentsStore.appointments.filter(
    (apt) => apt.doctorId === selectedDoctorId.value
  );
});

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
  formInitialDoctorId.value = undefined;
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
      <h1 class="text-3xl font-bold text-gray-900">Расписание</h1>
    </div>

    <div v-if="appointmentsStore.loading" class="flex items-center justify-center py-12">
      <div class="text-gray-500">Загрузка расписания...</div>
    </div>

    <div v-else-if="appointmentsStore.error" class="rounded-lg bg-red-50 p-4 text-red-700">
      <p class="font-medium">Ошибка загрузки:</p>
      <p>{{ appointmentsStore.error }}</p>
    </div>

    <div v-else>
      <div class="mb-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-gray-700">
            Фильтр по врачу:
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
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          @click="handleDateClick(new Date())"
        >
          + Новый приём
        </button>
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


