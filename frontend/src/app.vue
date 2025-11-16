<script setup lang="ts">
// Инициализация авторизации теперь происходит в плагине auth.client.ts
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Navigation />
    <main>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </main>
    <Toast />
  </div>
</template>
