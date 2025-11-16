import { defineStore } from 'pinia';
import type { Patient, CreatePatientDto, UpdatePatientDto } from '~/types/patient';
import { useToast } from '~/composables/useToast';

type PatientsState = {
  patients: Patient[];
  loading: boolean;
  error: string | null;
};

export const usePatientsStore = defineStore('patients', {
  state: (): PatientsState => ({
    patients: [],
    loading: false,
    error: null,
  }),

  getters: {
    getPatientById: (state) => {
      return (id: string) => state.patients.find((p) => p.id === id);
    },
  },

  actions: {
    async fetchPatients() {
      this.loading = true;
      this.error = null;
      try {
        console.log('============================ fetchPatients ============================');
        const { $api } = useNuxtApp();
        const data = await $api.get<Patient[]>('/patients');


        console.log('data:', data);
        this.patients = Array.isArray(data) ? data : [];
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch patients';
        this.patients = [];
        // Не пробрасываем ошибку дальше, чтобы UI мог показать сообщение
      } finally {
        this.loading = false;
      }
    },

    async createPatient(dto: CreatePatientDto) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        const patient = await $api.post<Patient>('/patients', dto);
        this.patients.push(patient);
        success('Пациент успешно создан');
        return patient;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
        this.error = errorMessage;
        showError(`Ошибка создания пациента: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updatePatient(id: string, dto: UpdatePatientDto) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        const patient = await $api.patch<Patient>(`/patients/${id}`, dto);
        const index = this.patients.findIndex((p) => p.id === id);
        if (index !== -1) {
          this.patients[index] = patient;
        }
        success('Пациент успешно обновлён');
        return patient;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
        this.error = errorMessage;
        showError(`Ошибка обновления пациента: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deletePatient(id: string) {
      this.loading = true;
      this.error = null;
      const { success, error: showError } = useToast();
      try {
        const { $api } = useNuxtApp();
        await $api.del(`/patients/${id}`);
        this.patients = this.patients.filter((p) => p.id !== id);
        success('Пациент успешно удалён');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient';
        this.error = errorMessage;
        showError(`Ошибка удаления пациента: ${errorMessage}`);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});

