<script setup lang="ts">
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Добро пожаловать в систему управления стоматологией
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Управляйте пациентами, расписанием и записями в одном месте.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <NuxtLink
          to="/patients"
          class="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">
            Пациенты
          </h2>
          <p class="text-gray-600">
            Просмотр и управление базой пациентов
          </p>
        </NuxtLink>

        <NuxtLink
          to="/doctors"
          class="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">
            Врачи
          </h2>
          <p class="text-gray-600">
            Управление списком врачей и их специализациями
          </p>
        </NuxtLink>

        <NuxtLink
          to="/schedule"
          class="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">
            Расписание
          </h2>
          <p class="text-gray-600">
            Календарь приёмов и управление записями
          </p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
