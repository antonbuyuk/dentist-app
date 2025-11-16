<script setup lang="ts">
import { useAuthStore } from '~/store/auth'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const authStore = useAuthStore()

// Редиректим на правильный dashboard в зависимости от роли пользователя
onMounted(() => {
  if (authStore.isAuthenticated && authStore.user) {
    const requestedRole = route.params.role as string

    // Маппинг старых ролей
    const roleMap: Record<string, string> = {
      user: 'patient',
    }

    const mappedRole = roleMap[requestedRole] || requestedRole

    // Если запрошенная роль не совпадает с ролью пользователя, редиректим
    if (mappedRole !== authStore.user.role) {
      navigateTo(authStore.dashboardPath)
    }
  } else {
    navigateTo('/login')
  }
})
</script>

<template>
  <div class="p-6">
    <div class="text-center py-12">
      <div class="text-gray-500">
        Загрузка...
      </div>
    </div>
  </div>
</template>

