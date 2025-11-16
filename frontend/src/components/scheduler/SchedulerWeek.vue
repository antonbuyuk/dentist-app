<script setup lang="ts">
import { startOfWeek, addDays } from 'date-fns'
import type { Appointment } from '~/types/schedule'
import SchedulerDay from './SchedulerDay.vue'

const props = defineProps<{
  weekOf: Date
  appointments: Appointment[]
}>()
const emit = defineEmits<{
  (e: 'move', payload: { id: string; start: string; end: string }): void
}>()

const start = computed(() => startOfWeek(props.weekOf, { weekStartsOn: 1 }))
const days = computed(() => Array.from({ length: 7 }, (_, i) => addDays(start.value, i)))
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
    <SchedulerDay
      v-for="d in days"
      :key="d.toISOString()"
      :date="d"
      :appointments="appointments"
      @move="emit('move', $event)"
    />
  </div>
</template>


