<script setup lang="ts">
import { useAuthStore } from '~/store/auth'

const authStore = useAuthStore()

const links = computed(() => {
  const baseLinks = [
    { label: 'Главная', to: '/', roles: ['developer', 'rootUser', 'admin'] },
    { label: 'Пользователи', to: '/users', roles: ['developer', 'rootUser', 'admin'] },
    { label: 'Пациенты', to: '/patients', roles: ['developer', 'rootUser', 'admin'] },
    { label: 'Врачи', to: '/doctors', roles: ['developer', 'rootUser', 'admin'] },
    { label: 'Расписание', to: '/schedule', roles: ['developer', 'rootUser', 'doctor', 'admin'] },
  ]

  if (!authStore.isAuthenticated) return []

  const userRole = authStore.user?.role
  if (!userRole) return []

  return baseLinks.filter((link) => {
    if (!link.roles) return true
    return link.roles.includes(userRole)
  })
})

const handleLogout = async () => {
  await authStore.logout()
}
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
          <div
            v-if="authStore.isAuthenticated"
            class="flex items-center gap-4"
          >
            <NuxtLink
              :to="authStore.dashboardPath"
              class="px-3 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Личный кабинет
            </NuxtLink>
            <span class="text-sm">
              {{ authStore.user?.email }}
            </span>
            <button
              class="px-3 py-2 rounded hover:bg-blue-700 transition-colors"
              @click="handleLogout"
            >
              Выход
            </button>
          </div>
          <NuxtLink
            v-else
            to="/login"
            class="px-3 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Вход
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

