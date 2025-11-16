import { useAuthStore } from '~/store/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // Если токен есть, но пользователь еще не загружен, ждем загрузки
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Проверка конкретной роли (для dashboard страниц)
  const requiredRole = to.meta.role as string | undefined

  console.log('authStore.user?.role', authStore.user?.role)
  console.log('requiredRole', requiredRole)

  if (requiredRole && authStore.user?.role !== requiredRole) {
    return navigateTo(authStore.dashboardPath)
  }

  // Проверка списка разрешённых ролей (для других страниц)
  const allowedRoles = to.meta.allowedRoles as string[] | undefined
  if (allowedRoles && authStore.user && !allowedRoles.includes(authStore.user.role)) {
    return navigateTo(authStore.dashboardPath)
  }
})

