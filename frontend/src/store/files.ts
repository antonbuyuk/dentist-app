import { defineStore } from 'pinia'
import type { FileAttachment } from '~/types/file-attachment'
import { useToast } from '~/composables/useToast'

type FilesState = {
  loading: boolean
  error: string | null
}

export const useFilesStore = defineStore('files', {
  state: (): FilesState => ({
    loading: false,
    error: null,
  }),

  actions: {
    async uploadFile(
      file: File,
      medicalRecordId: string | null,
      description?: string,
    ): Promise<FileAttachment> {
      this.loading = true
      this.error = null

      try {
        const formData = new FormData()
        formData.append('file', file)
        if (medicalRecordId) {
          formData.append('medicalRecordId', medicalRecordId)
        }
        if (description) {
          formData.append('description', description)
        }

        const apiBase = useRuntimeConfig().public.apiBase
        const token = useCookie('access_token').value

        const response = await fetch(`${apiBase}/files/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Ошибка загрузки файла')
        }

        const data = await response.json()
        useToast().success('Файл успешно загружен')
        return data
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки файла'
        // Не показываем toast здесь, так как компонент сам обработает ошибку
        // useToast().error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchFiles(medicalRecordId?: string | null): Promise<FileAttachment[]> {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const queryParams = new URLSearchParams()
        if (medicalRecordId) {
          queryParams.append('medicalRecordId', medicalRecordId)
        }

        const url = `/files${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        const data = await $api.get<FileAttachment[]>(url)
        return data
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки файлов'
        useToast().error(this.error || 'Ошибка загрузки файлов')
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteFile(id: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.del(`/files/${id}`)
        useToast().success('Файл успешно удалён')
      } catch (error: any) {
        this.error = error.message || 'Ошибка удаления файла'
        useToast().error(this.error || 'Ошибка удаления файла')
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateFileDescription(id: string, description: string | null): Promise<FileAttachment> {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const data = await $api.patch<FileAttachment>(`/files/${id}/description`, {
          description: description || undefined,
        })
        useToast().success('Описание обновлено')
        return data
      } catch (error: any) {
        this.error = error.message || 'Ошибка обновления описания'
        useToast().error(this.error || 'Ошибка обновления описания')
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateFileMedicalRecord(id: string, medicalRecordId: string | null): Promise<FileAttachment> {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const data = await $api.patch<FileAttachment>(`/files/${id}/medical-record`, {
          medicalRecordId: medicalRecordId || undefined,
        })
        return data
      } catch (error: any) {
        this.error = error.message || 'Ошибка привязки файла к записи'
        useToast().error(this.error || 'Ошибка привязки файла к записи')
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})

