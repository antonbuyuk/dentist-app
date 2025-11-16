<script setup lang="ts">
import type { MedicalRecord, CreateMedicalRecordDto, UpdateMedicalRecordDto } from '~/types/medical-record'
import type { FileAttachment } from '~/types/file-attachment'
import { useMedicalRecordsStore } from '~/store/medical-records'
import { useFilesStore } from '~/store/files'
import { useToast } from '~/composables/useToast'
import PhotoGallery from '~/components/PhotoGallery.vue'
import PhotoViewer from '~/components/PhotoViewer.vue'

const props = defineProps<{
  appointment: {
    id: string
    patientId: string
    doctorId: string
    patient?: {
      firstName?: string | null
      lastName?: string | null
    }
    doctor?: {
      firstName?: string | null
      lastName?: string | null
    }
  }
  record?: MedicalRecord | null
}>()

const emit = defineEmits<{
  close: []
  saved: [record: MedicalRecord]
}>()

const medicalRecordsStore = useMedicalRecordsStore()
const filesStore = useFilesStore()

const form = ref<CreateMedicalRecordDto | UpdateMedicalRecordDto>({
  appointmentId: props.appointment.id,
  patientId: props.appointment.patientId,
  doctorId: props.appointment.doctorId,
  diagnosis: props.record?.diagnosis || '',
  treatment: props.record?.treatment || '',
  notes: props.record?.notes || '',
  recommendations: props.record?.recommendations || '',
})

const isSubmitting = ref(false)
const files = ref<FileAttachment[]>([])
const isLoadingFiles = ref(false)
const viewingFile = ref<FileAttachment | null>(null)
const isViewerOpen = ref(false)

watch(() => props.record?.id, async (recordId) => {
  if (recordId) {
    await loadFiles()
  }
}, { immediate: true })

const loadFiles = async () => {
  if (!props.record?.id) return

  isLoadingFiles.value = true
  try {
    files.value = await filesStore.fetchFiles(props.record.id)
  } catch (error) {
    console.error('Error loading files:', error)
  } finally {
    isLoadingFiles.value = false
  }
}

const uploadingFiles = ref<Set<string>>(new Set())
const uploadErrorShown = ref(false)

const handleFileUpload = async (file: File, description?: string) => {
  const fileKey = `${file.name}-${file.size}`

  // Предотвращаем дублирование загрузки
  if (uploadingFiles.value.has(fileKey)) {
    return
  }

  uploadingFiles.value.add(fileKey)

  try {
    const recordId = props.record?.id || null
    const uploadedFile = await filesStore.uploadFile(file, recordId, description)
    files.value.push(uploadedFile)
    uploadErrorShown.value = false // Сбрасываем флаг при успешной загрузке
  } catch (error: any) {
    // Показываем ошибку только один раз для всех файлов при проблеме с подключением
    const errorMessage = error?.message || 'Ошибка загрузки файла'
    const isConnectionError = errorMessage.includes('CONNECTION_REFUSED') ||
                              errorMessage.includes('Failed to fetch') ||
                              errorMessage.includes('network')

    if (isConnectionError) {
      if (!uploadErrorShown.value) {
        useToast().error('Не удалось подключиться к серверу. Убедитесь, что backend сервер запущен на порту 3001.')
        uploadErrorShown.value = true
      }
      // Не логируем каждую ошибку в консоль, чтобы не засорять её
    } else {
      // Для других ошибок показываем сообщение
      console.error('Error uploading file:', error)
      useToast().error(`Ошибка загрузки файла "${file.name}": ${errorMessage}`)
    }
  } finally {
    uploadingFiles.value.delete(fileKey)
  }
}

const handleFileDelete = async (fileId: string) => {
  try {
    await filesStore.deleteFile(fileId)
    files.value = files.value.filter((f) => f.id !== fileId)
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

const handleFileView = (file: FileAttachment) => {
  viewingFile.value = file
  isViewerOpen.value = true
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    let savedRecord: MedicalRecord

    if (props.record) {
      // Обновление существующей записи
      savedRecord = await medicalRecordsStore.updateMedicalRecord(
        props.record.id,
        form.value as UpdateMedicalRecordDto,
      )
    } else {
      // Создание новой записи
      savedRecord = await medicalRecordsStore.createMedicalRecord(
        form.value as CreateMedicalRecordDto,
      )

      // Привязываем загруженные файлы к созданной записи
      if (files.value.length > 0) {
        for (const file of files.value) {
          if (!file.medicalRecordId) {
            try {
              await filesStore.updateFileMedicalRecord(file.id, savedRecord.id)
            } catch (error) {
              console.error('Error linking file to record:', error)
            }
          }
        }
      }
    }

    emit('saved', savedRecord)
    emit('close')
  } catch (error) {
    console.error('Error saving medical record:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">
            {{ record ? 'Редактировать медицинскую запись' : 'Создать медицинскую запись' }}
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="handleCancel"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          class="space-y-6"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Диагноз
            </label>
            <textarea
              v-model="form.diagnosis"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите диагноз"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Лечение
            </label>
            <textarea
              v-model="form.treatment"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Опишите проведённое лечение"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Заметки врача
            </label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Дополнительные заметки"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Рекомендации пациенту
            </label>
            <textarea
              v-model="form.recommendations"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Рекомендации по уходу и дальнейшему лечению"
            />
          </div>

          <!-- Фотогалерея -->
          <div class="pt-4 border-t">
            <PhotoGallery
              :files="files"
              :medical-record-id="record?.id || null"
              :can-upload="true"
              :can-delete="true"
              @upload="handleFileUpload"
              @delete="handleFileDelete"
              @view="handleFileView"
            />
          </div>

          <div class="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              :disabled="isSubmitting"
              @click="handleCancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Сохранение...' : record ? 'Сохранить изменения' : 'Создать запись' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Просмотрщик фотографий -->
    <PhotoViewer
      :file="viewingFile"
      :is-open="isViewerOpen"
      @close="isViewerOpen = false"
    />
  </div>
</template>

