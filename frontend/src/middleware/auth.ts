import { useAuthStore } from '~/store/auth'

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  // Если токен есть, но пользователь еще не загружен, ждем загрузки
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})

