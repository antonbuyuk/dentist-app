<script setup lang="ts">
import type { FileAttachment } from '~/types/file-attachment'
import { useAuthStore } from '~/store/auth'

defineProps<{
  files: FileAttachment[]
  medicalRecordId?: string | null
  canUpload?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  upload: [file: File, description?: string]
  delete: [fileId: string]
  view: [file: FileAttachment]
}>()

const authStore = useAuthStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

const apiBase = useRuntimeConfig().public.apiBase

const getFileUrl = (file: FileAttachment) => {
  // Если есть base64 данные, используем их напрямую
  if (file.fileData) {
    return file.fileData
  }
  // Иначе используем API endpoint для скачивания
  return `${apiBase}/files/${file.id}/download`
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    // Отправляем все выбранные файлы последовательно
    // Это предотвращает множественные ошибки при недоступности сервера
    const fileArray = Array.from(files)
    for (const file of fileArray) {
      emit('upload', file)
      // Небольшая задержка между файлами для стабильности
      if (fileArray.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }
    // Сбрасываем input
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const handleDelete = (fileId: string) => {
  if (confirm('Вы уверены, что хотите удалить этот файл?')) {
    emit('delete', fileId)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const isImage = (mimeType: string) => {
  return mimeType.startsWith('image/')
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">
        Фотогалерея ({{ files.length }})
      </h3>
      <div
        v-if="canUpload"
        class="flex items-center gap-2"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleFileSelect"
        >
        <button
          type="button"
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          @click="fileInputRef?.click()"
        >
          Загрузить фото
        </button>
        <span class="text-xs text-gray-500">
          (можно выбрать несколько)
        </span>
      </div>
    </div>

    <div
      v-if="files.length === 0"
      class="text-center py-8 text-gray-500 italic"
    >
      Фотографии не загружены
    </div>

    <div
      v-else
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <div
        v-for="file in files"
        :key="file.id"
        class="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div
          v-if="isImage(file.mimeType)"
          class="aspect-square bg-gray-100 cursor-pointer"
          @click="emit('view', file)"
        >
          <img
            :src="getFileUrl(file)"
            :alt="file.description || file.fileName"
            class="w-full h-full object-cover"
          >
        </div>
        <div
          v-else
          class="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer"
          @click="emit('view', file)"
        >
          <svg
            class="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <!-- Overlay с информацией -->
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div class="text-white text-center p-2">
            <p class="text-sm font-medium truncate">
              {{ file.fileName }}
            </p>
            <p class="text-xs">
              {{ formatFileSize(file.fileSize) }}
            </p>
          </div>
        </div>

        <!-- Кнопка удаления -->
        <button
          v-if="canDelete && (file.userId === authStore.user?.id || ['developer', 'rootUser', 'admin'].includes(authStore.user?.role || ''))"
          class="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
          @click.stop="handleDelete(file.id)"
        >
          <svg
            class="w-4 h-4"
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

        <!-- Описание файла -->
        <div
          v-if="file.description"
          class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2"
        >
          {{ file.description }}
        </div>
      </div>
    </div>
  </div>
</template>

