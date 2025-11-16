<script setup lang="ts">
import type { MedicalRecord } from '~/types/medical-record'
import type { FileAttachment } from '~/types/file-attachment'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useFilesStore } from '~/store/files'
import { useToast } from '~/composables/useToast'
import PhotoGallery from '~/components/PhotoGallery.vue'
import PhotoViewer from '~/components/PhotoViewer.vue'

const props = defineProps<{
  record: MedicalRecord
  showActions?: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const filesStore = useFilesStore()
const files = ref<FileAttachment[]>([])
const isLoadingFiles = ref(false)
const viewingFile = ref<FileAttachment | null>(null)
const isViewerOpen = ref(false)

const loadFiles = async () => {
  if (!props.record.id) return

  isLoadingFiles.value = true
  try {
    const loadedFiles = await filesStore.fetchFiles(props.record.id)
    files.value = loadedFiles || []
    console.log('Loaded files for record:', props.record.id, loadedFiles)
  } catch (error) {
    console.error('Error loading files:', error)
    files.value = []
  } finally {
    isLoadingFiles.value = false
  }
}

watch(() => props.record.id, async (recordId) => {
  if (recordId) {
    await loadFiles()
  }
}, { immediate: true })

const handleFileView = (file: FileAttachment) => {
  viewingFile.value = file
  isViewerOpen.value = true
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
    const uploadedFile = await filesStore.uploadFile(file, props.record.id, description)
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

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru })
  } catch {
    return dateString
  }
}

const patientName = computed(() => {
  if (props.record.patient) {
    const { firstName, lastName } = props.record.patient
    return `${firstName || ''} ${lastName || ''}`.trim() || props.record.patient.email
  }
  return 'Неизвестный пациент'
})

const doctorName = computed(() => {
  if (props.record.doctor) {
    const { firstName, lastName } = props.record.doctor
    return `${firstName || ''} ${lastName || ''}`.trim() || props.record.doctor.email
  }
  return 'Неизвестный врач'
})

const createdByName = computed(() => {
  if (props.record.createdBy) {
    const { firstName, lastName } = props.record.createdBy
    return `${firstName || ''} ${lastName || ''}`.trim() || props.record.createdBy.email
  }
  return 'Неизвестный пользователь'
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">
          Медицинская запись
        </h3>
        <p class="text-sm text-gray-500">
          Создано: {{ formatDate(record.createdAt) }}
        </p>
        <p
          v-if="record.updatedAt !== record.createdAt"
          class="text-sm text-gray-500"
        >
          Обновлено: {{ formatDate(record.updatedAt) }}
        </p>
      </div>
      <div
        v-if="showActions"
        class="flex gap-2"
      >
        <button
          class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          @click="emit('edit')"
        >
          Редактировать
        </button>
        <button
          class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
          @click="emit('delete')"
        >
          Удалить
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-1">
          Пациент
        </h4>
        <p class="text-gray-900">
          {{ patientName }}
        </p>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-1">
          Врач
        </h4>
        <p class="text-gray-900">
          {{ doctorName }}
        </p>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-1">
          Заполнил запись
        </h4>
        <p class="text-gray-900">
          {{ createdByName }}
        </p>
      </div>

      <div v-if="record.diagnosis">
        <h4 class="text-sm font-medium text-gray-700 mb-1">
          Диагноз
        </h4>
        <p class="text-gray-900 whitespace-pre-wrap">
          {{ record.diagnosis }}
        </p>
      </div>

      <div v-if="record.treatment">
        <h4 class="text-sm font-medium text-gray-700 mb-1">
          Лечение
        </h4>
        <p class="text-gray-900 whitespace-pre-wrap">
          {{ record.treatment }}
        </p>
      </div>

      <div v-if="record.notes">
        <h4 class="text-sm font-medium text-gray-700 mb-1">
          Заметки врача
        </h4>
        <p class="text-gray-900 whitespace-pre-wrap">
          {{ record.notes }}
        </p>
      </div>

      <div v-if="record.recommendations">
        <h4 class="text-sm font-medium text-gray-700 mb-1">
          Рекомендации пациенту
        </h4>
        <p class="text-gray-900 whitespace-pre-wrap">
          {{ record.recommendations }}
        </p>
      </div>

      <div
        v-if="!record.diagnosis && !record.treatment && !record.notes && !record.recommendations"
        class="text-gray-500 italic"
      >
        Запись пуста
      </div>
    </div>

    <!-- Фотогалерея -->
    <div
      v-if="record.id"
      class="mt-6 pt-6 border-t"
    >
      <div v-if="isLoadingFiles" class="text-center py-4 text-gray-500">
        Загрузка фотографий...
      </div>
      <PhotoGallery
        v-else
        :files="files"
        :medical-record-id="record.id"
        :can-upload="showActions"
        :can-delete="showActions"
        @upload="handleFileUpload"
        @delete="handleFileDelete"
        @view="handleFileView"
      />
    </div>
  </div>

  <!-- Просмотрщик фотографий -->
  <PhotoViewer
    :file="viewingFile"
    :is-open="isViewerOpen"
    @close="isViewerOpen = false"
  />
</template>

