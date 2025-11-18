import { defineStore } from 'pinia'

export type AppointmentSuggestion = {
  id: string
  doctorId: string
  patientId: string
  startTime: string
  endTime: string
  notes?: string | null
  status: 'pending' | 'approved' | 'rejected'
  workplaceId?: string | null
  createdAt: string
  updatedAt: string
  reviewedAt?: string | null
  reviewedBy?: string | null
  doctor?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  patient?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  reviewer?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  workplace?: {
    id: string
    name: string
  } | null
}

export type CreateAppointmentSuggestionDto = {
  patientId: string
  startTime: string
  endTime: string
  notes?: string
  workplaceId?: string
}

export type UpdateAppointmentSuggestionDto = {
  status: 'pending' | 'approved' | 'rejected'
}

export const useAppointmentSuggestionsStore = defineStore('appointmentSuggestions', {
  state: () => ({
    suggestions: [] as AppointmentSuggestion[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async createSuggestion(data: CreateAppointmentSuggestionDto) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const suggestion = await $api.post<AppointmentSuggestion>('/appointment-suggestions', data)
        this.suggestions.unshift(suggestion)
        return suggestion
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка создания предложения'
        this.error = errorMessage
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchSuggestions() {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const suggestions = await $api.get<AppointmentSuggestion[]>('/appointment-suggestions')
        this.suggestions = Array.isArray(suggestions) ? suggestions : []
        return this.suggestions
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки предложений'
        this.error = errorMessage
        this.suggestions = []
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchSuggestion(id: string) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const suggestion = await $api.get<AppointmentSuggestion>(`/appointment-suggestions/${id}`)
        const index = this.suggestions.findIndex((s) => s.id === id)
        if (index !== -1) {
          this.suggestions[index] = suggestion
        } else {
          this.suggestions.push(suggestion)
        }
        return suggestion
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки предложения'
        this.error = errorMessage
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateSuggestion(id: string, data: UpdateAppointmentSuggestionDto) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const suggestion = await $api.patch<AppointmentSuggestion>(`/appointment-suggestions/${id}`, data)
        const index = this.suggestions.findIndex((s) => s.id === id)
        if (index !== -1) {
          this.suggestions[index] = suggestion
        }
        return suggestion
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления предложения'
        this.error = errorMessage
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})

