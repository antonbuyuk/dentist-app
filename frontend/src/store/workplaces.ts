import { defineStore } from 'pinia'
import type {
  Workplace,
  CreateWorkplaceDto,
  UpdateWorkplaceDto,
  AssignDoctorDto,
} from '~/types/workplace'
import { useToast } from '~/composables/useToast'

interface WorkplacesState {
  workplaces: Workplace[]
  loading: boolean
  error: string | null
}

export const useWorkplacesStore = defineStore('workplaces', {
  state: (): WorkplacesState => ({
    workplaces: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchWorkplaces() {
      if (this.loading) return

      this.loading = true
      this.error = null
      const { error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const workplaces = await $api.get<Workplace[]>('/workplaces')
        this.workplaces = workplaces
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка загрузки рабочих мест'
        this.error = errorMessage
        showError(`Ошибка загрузки рабочих мест: ${errorMessage}`)
      } finally {
        this.loading = false
      }
    },

    async createWorkplace(dto: CreateWorkplaceDto) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const newWorkplace = await $api.post<Workplace>('/workplaces', dto)
        this.workplaces.unshift(newWorkplace)
        success('Рабочее место успешно создано')
        return newWorkplace
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка создания рабочего места'
        this.error = errorMessage
        showError(`Ошибка создания рабочего места: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateWorkplace(workplaceId: string, dto: UpdateWorkplaceDto) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const updatedWorkplace = await $api.patch<Workplace>(
          `/workplaces/${workplaceId}`,
          dto,
        )

        // Обновляем рабочее место в списке
        const index = this.workplaces.findIndex((w) => w.id === workplaceId)
        if (index !== -1) {
          this.workplaces[index] = updatedWorkplace
        }

        success('Рабочее место успешно обновлено')
        return updatedWorkplace
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Ошибка обновления рабочего места'
        this.error = errorMessage
        showError(`Ошибка обновления рабочего места: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteWorkplace(workplaceId: string) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        await $api.del(`/workplaces/${workplaceId}`)

        // Удаляем рабочее место из списка
        this.workplaces = this.workplaces.filter((w) => w.id !== workplaceId)

        success('Рабочее место успешно удалено')
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка удаления рабочего места'
        this.error = errorMessage
        showError(`Ошибка удаления рабочего места: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async assignDoctor(workplaceId: string, doctorId: string) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        await $api.post(`/workplaces/${workplaceId}/doctors`, { doctorId })
        success('Врач успешно назначен на рабочее место')
        // Обновляем список рабочих мест
        await this.fetchWorkplaces()
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Ошибка назначения врача на рабочее место'
        this.error = errorMessage
        showError(`Ошибка назначения врача: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async unassignDoctor(workplaceId: string, doctorId: string) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        await $api.del(`/workplaces/${workplaceId}/doctors/${doctorId}`)
        success('Врач успешно снят с рабочего места')
        // Обновляем список рабочих мест
        await this.fetchWorkplaces()
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Ошибка снятия врача с рабочего места'
        this.error = errorMessage
        showError(`Ошибка снятия врача: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})

