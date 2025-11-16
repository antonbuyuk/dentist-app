<script setup lang="ts">
import { useCounterStore } from '~/store/counter'

const counter = useCounterStore()
</script>

<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-semibold">Nuxt Frontend</h1>
    <div class="flex items-center gap-4">
      <button class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" @click="counter.decrement">-</button>
      <div class="min-w-24 text-center text-xl font-mono">{{ counter.count }}</div>
      <button class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" @click="counter.increment">+</button>
      <button class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" @click="counter.reset">Reset</button>
    </div>
    <p class="text-gray-600">Double: <span class="font-medium">{{ counter.double }}</span></p>
  </div>
</template>
