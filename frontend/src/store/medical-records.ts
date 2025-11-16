import { defineStore } from 'pinia'
import type { MedicalRecord, CreateMedicalRecordDto, UpdateMedicalRecordDto } from '~/types/medical-record'
import { useToast } from '~/composables/useToast'

type MedicalRecordsState = {
  medicalRecords: MedicalRecord[]
  loading: boolean
  error: string | null
}

export const useMedicalRecordsStore = defineStore('medicalRecords', {
  state: (): MedicalRecordsState => ({
    medicalRecords: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchMedicalRecords(filters?: {
      patientId?: string
      doctorId?: string
      appointmentId?: string
    }) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const queryParams = new URLSearchParams()

        if (filters?.patientId) {
          queryParams.append('patientId', filters.patientId)
        }
        if (filters?.doctorId) {
          queryParams.append('doctorId', filters.doctorId)
        }
        if (filters?.appointmentId) {
          queryParams.append('appointmentId', filters.appointmentId)
        }

        const url = `/medical-records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        const data = await $api.get<MedicalRecord[]>(url)

        this.medicalRecords = data
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки медицинских записей'
        useToast().error(this.error)
        console.error('Error fetching medical records:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchMedicalRecord(id: string) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const data = await $api.get<MedicalRecord>(`/medical-records/${id}`)

        const index = this.medicalRecords.findIndex((r) => r.id === id)
        if (index !== -1) {
          this.medicalRecords[index] = data
        } else {
          this.medicalRecords.push(data)
        }

        return data
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки медицинской записи'
        useToast().error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createMedicalRecord(createDto: CreateMedicalRecordDto) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const data = await $api.post<MedicalRecord>('/medical-records', createDto)

        this.medicalRecords.unshift(data)
        useToast().success('Медицинская запись создана')
        return data
      } catch (error: any) {
        this.error = error.message || 'Ошибка создания медицинской записи'
        useToast().error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateMedicalRecord(id: string, updateDto: UpdateMedicalRecordDto) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const data = await $api.patch<MedicalRecord>(`/medical-records/${id}`, updateDto)

        const index = this.medicalRecords.findIndex((r) => r.id === id)
        if (index !== -1) {
          this.medicalRecords[index] = data
        }

        useToast().success('Медицинская запись обновлена')
        return data
      } catch (error: any) {
        this.error = error.message || 'Ошибка обновления медицинской записи'
        useToast().error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteMedicalRecord(id: string) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.del(`/medical-records/${id}`)

        this.medicalRecords = this.medicalRecords.filter((r) => r.id !== id)
        useToast().success('Медицинская запись удалена')
      } catch (error: any) {
        this.error = error.message || 'Ошибка удаления медицинской записи'
        useToast().error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },

  getters: {
    getRecordByAppointmentId: (state) => {
      return (appointmentId: string) => {
        return state.medicalRecords.find((r) => r.appointmentId === appointmentId)
      }
    },

    getRecordsByPatientId: (state) => {
      return (patientId: string) => {
        return state.medicalRecords.filter((r) => r.patientId === patientId)
      }
    },

    getRecordsByDoctorId: (state) => {
      return (doctorId: string) => {
        return state.medicalRecords.filter((r) => r.doctorId === doctorId)
      }
    },
  },
})

