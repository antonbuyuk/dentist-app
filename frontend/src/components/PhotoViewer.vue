<script setup lang="ts">
import type { FileAttachment } from '~/types/file-attachment'

defineProps<{
  file: FileAttachment | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const apiBase = useRuntimeConfig().public.apiBase

const getFileUrl = (file: FileAttachment) => {
  // Если есть base64 данные, используем их напрямую
  if (file.fileData) {
    return file.fileData
  }
  // Иначе используем API endpoint для скачивания
  return `${apiBase}/files/${file.id}/download`
}

const isImage = (mimeType: string) => {
  return mimeType.startsWith('image/')
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <div
    v-if="isOpen && file"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
  >
    <div class="relative max-w-7xl max-h-[90vh] p-4">
      <button
        class="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
        @click="emit('close')"
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

      <div
        v-if="isImage(file.mimeType)"
        class="flex items-center justify-center"
      >
        <img
          :src="getFileUrl(file)"
          :alt="file.description || file.fileName"
          class="max-w-full max-h-[90vh] object-contain"
        >
      </div>

      <div
        v-else
        class="bg-white rounded-lg p-8 max-w-2xl"
      >
        <div class="text-center">
          <svg
            class="w-24 h-24 text-gray-400 mx-auto mb-4"
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
          <h3 class="text-xl font-semibold mb-2">
            {{ file.fileName }}
          </h3>
          <p class="text-gray-600 mb-4">
            {{ formatFileSize(file.fileSize) }}
          </p>
          <a
            :href="getFileUrl(file)"
            target="_blank"
            class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Скачать файл
          </a>
        </div>
      </div>

      <!-- Информация о файле -->
      <div class="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded">
        <p class="font-medium">
          {{ file.fileName }}
        </p>
        <p
          v-if="file.description"
          class="text-sm mt-1"
        >
          {{ file.description }}
        </p>
        <p class="text-xs text-gray-300 mt-2">
          {{ formatFileSize(file.fileSize) }} • {{ file.mimeType }}
        </p>
      </div>
    </div>
  </div>
</template>

