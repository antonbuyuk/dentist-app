import { useAuthStore } from '~/store/auth'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // Восстанавливаем токен из cookie синхронно
  const tokenCookie = useCookie<string>('access_token')
  if (tokenCookie.value) {
    authStore.token = tokenCookie.value
    // Загружаем данные пользователя асинхронно
    await authStore.fetchUser()
  }
})

