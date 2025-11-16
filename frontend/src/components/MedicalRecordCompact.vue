<script setup lang="ts">
import type { MedicalRecord } from '~/types/medical-record'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const props = defineProps<{
  record: MedicalRecord
  showActions?: boolean
}>()

const emit = defineEmits<{
  click: []
  edit: []
  delete: []
}>()

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru })
  } catch {
    return dateString
  }
}

const createdByName = computed(() => {
  if (props.record.createdBy) {
    const { firstName, lastName } = props.record.createdBy
    return `${firstName || ''} ${lastName || ''}`.trim() || props.record.createdBy.email
  }
  return 'Неизвестный пользователь'
})
</script>

<template>
  <div
    class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
    @click="emit('click')"
  >
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-4 text-sm text-gray-600">
          <span>
            {{ formatDate(record.createdAt) }}
          </span>
          <span class="text-gray-400">•</span>
          <span>
            Заполнил: {{ createdByName }}
          </span>
        </div>
      </div>
      <div
        v-if="showActions"
        class="flex gap-2"
        @click.stop
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
  </div>
</template>

