import { defineStore } from 'pinia';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '~/types/appointment';
import { useToast } from '~/composables/useToast';

type AppointmentsState = {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
};

export const useAppointmentsStore = defineStore('appointments', {
  state: (): AppointmentsState => ({
    appointments: [],
    loading: false,
    error: null,
  }),

  getters: {
    getAppointmentById: (state) => {
      return (id: string) => state.appointments.find((a) => a.id === id);
    },
    getAppointmentsByDateRange: (state) => {
      return (startDate: Date, endDate: Date) => {
        return state.appointments.filter((a) => {
          const start = new Date(a.startTime);
          return start >= startDate && start <= endDate;
        });
      };
    },
  },

  actions: {
    async fetchAppointments(startDate?: Date, endDate?: Date) {
      // Предотвращаем повторные запросы, если уже идет загрузка
      if (this.loading) {
        return;
      }
      this.loading = true;
      this.error = null;
      try {
        const { $api } = useNuxtApp();
        const params: Record<string, string> = {};
        if (startDate && endDate) {
          params.startDate = startDate.toISOString();
          params.endDate = endDate.toISOString();
        }
        const data = await $api.get<Appointment[]>('/appointments', { query: params });
        this.appointments = Array.isArray(data) ? data : [];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
        this.error = errorMessage;
        this.appointments = [];
        const { error: showError } = useToast();
        showError(`Ошибка загрузки приёмов: ${errorMessage}`);
      } finally {
        this.loading = false;
      }
    },

    async createAppointment(dto: CreateAppointmentDto) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        const appointment = await $api.post<Appointment>('/appointments', dto);
        this.appointments.push(appointment);
        success('Приём успешно создан');
        return appointment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create appointment';
        this.error = errorMessage;
        showError(`Ошибка создания приёма: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateAppointment(id: string, dto: UpdateAppointmentDto) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        const appointment = await $api.patch<Appointment>(`/appointments/${id}`, dto);
        const index = this.appointments.findIndex((a) => a.id === id);
        if (index !== -1) {
          this.appointments[index] = appointment;
        }
        success('Приём успешно обновлён');
        return appointment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment';
        this.error = errorMessage;
        showError(`Ошибка обновления приёма: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteAppointment(id: string) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        await $api.del(`/appointments/${id}`);
        this.appointments = this.appointments.filter((a) => a.id !== id);
        success('Приём успешно удалён');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
        this.error = errorMessage;
        showError(`Ошибка удаления приёма: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});

