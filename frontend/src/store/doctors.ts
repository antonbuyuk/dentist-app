import { defineStore } from 'pinia';
import type { Doctor, CreateDoctorDto, UpdateDoctorDto } from '~/types/doctor';
import { useToast } from '~/composables/useToast';

type DoctorsState = {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
};

export const useDoctorsStore = defineStore('doctors', {
  state: (): DoctorsState => ({
    doctors: [],
    loading: false,
    error: null,
  }),

  getters: {
    getDoctorById: (state) => {
      return (id: string) => state.doctors.find((d) => d.id === id);
    },
  },

  actions: {
    async fetchDoctors() {
      this.loading = true;
      this.error = null;
      try {
        const { $api } = useNuxtApp();
        const data = await $api.get<Doctor[]>('/doctors');
        this.doctors = Array.isArray(data) ? data : [];
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch doctors';
        this.doctors = [];
      } finally {
        this.loading = false;
      }
    },

    async createDoctor(dto: CreateDoctorDto) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        const doctor = await $api.post<Doctor>('/doctors', dto);
        this.doctors.push(doctor);
        success('Врач успешно создан');
        return doctor;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create doctor';
        this.error = errorMessage;
        showError(`Ошибка создания врача: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateDoctor(id: string, dto: UpdateDoctorDto) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        const doctor = await $api.patch<Doctor>(`/doctors/${id}`, dto);
        const index = this.doctors.findIndex((d) => d.id === id);
        if (index !== -1) {
          this.doctors[index] = doctor;
        }
        success('Врач успешно обновлён');
        return doctor;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update doctor';
        this.error = errorMessage;
        showError(`Ошибка обновления врача: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteDoctor(id: string) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        await $api.del(`/doctors/${id}`);
        this.doctors = this.doctors.filter((d) => d.id !== id);
        success('Врач успешно удалён');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete doctor';
        this.error = errorMessage;
        showError(`Ошибка удаления врача: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});

