<script setup lang="ts">
const links = [
  { label: 'Главная', to: '/' },
  { label: 'Пациенты', to: '/patients' },
  { label: 'Врачи', to: '/doctors' },
  { label: 'Расписание', to: '/schedule' },
]
</script>

<template>
  <nav class="bg-blue-600 text-white shadow-lg">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <NuxtLink
            to="/"
            class="text-xl font-bold"
          >
            Стоматология
          </NuxtLink>
        </div>
        <div class="flex items-center gap-6">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="px-3 py-2 rounded hover:bg-blue-700 transition-colors"
            active-class="bg-blue-800"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

