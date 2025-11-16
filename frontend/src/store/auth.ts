import { defineStore } from 'pinia'
import type { LoginDto, RegisterDto, AuthResponse, User } from '~/types/auth'
import { useToast } from '~/composables/useToast'

type AuthState = {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token, // Проверяем только токен, user может загружаться
    isDeveloper: (state) => state.user?.role === 'developer',
    isRootUser: (state) => state.user?.role === 'rootUser',
    isDoctor: (state) => state.user?.role === 'doctor',
    isPatient: (state) => state.user?.role === 'patient',
    isAdmin: (state) => state.user?.role === 'admin',
    dashboardPath: (state) => {
      if (!state.user) return '/login'
      const role = state.user.role

      // Маппинг старых ролей на новые
      const roleMap: Record<string, string> = {
        user: 'patient', // Старая роль user -> patient
      }

      const mappedRole = roleMap[role] || role

      // Проверяем, что роль валидна
      const validRoles = ['developer', 'rootUser', 'doctor', 'patient', 'admin']
      if (!validRoles.includes(mappedRole)) {
        return '/dashboard/patient' // Fallback на patient
      }

      return `/dashboard/${mappedRole}`
    },
  },

  actions: {
    async login(loginDto: LoginDto) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const response = await $api.post<AuthResponse>('/auth/login', loginDto)

        // Сохраняем токен в cookie
        const tokenCookie = useCookie<string>('access_token', {
          maxAge: 60 * 60 * 24 * 7, // 7 дней
          secure: true,
          sameSite: 'strict',
        })
        tokenCookie.value = response.access_token

        this.token = response.access_token
        this.user = response.user

        success('Успешный вход в систему')
        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка входа'
        this.error = errorMessage
        showError(`Ошибка входа: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(registerDto: RegisterDto) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const response = await $api.post<AuthResponse>('/auth/register', registerDto)

        // Сохраняем токен в cookie
        const tokenCookie = useCookie<string>('access_token', {
          maxAge: 60 * 60 * 24 * 7, // 7 дней
          secure: true,
          sameSite: 'strict',
        })
        tokenCookie.value = response.access_token

        this.token = response.access_token
        this.user = response.user

        success('Регистрация успешна')
        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации'
        this.error = errorMessage
        showError(`Ошибка регистрации: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      const tokenCookie = useCookie<string>('access_token')
      tokenCookie.value = null

      this.token = null
      this.user = null

      const { success } = useToast()
      success('Вы вышли из системы')

      await navigateTo('/login')
    },

    async fetchUser() {
      if (!this.token) return

      try {
        const { $api } = useNuxtApp()
        const user = await $api.get<User>('/auth/me')
        this.user = user
      } catch (err) {
        // Если токен невалидный, очищаем состояние без редиректа
        // (редирект обработает middleware)
        const tokenCookie = useCookie<string>('access_token')
        tokenCookie.value = null
        this.token = null
        this.user = null
      }
    },

    // initAuth больше не нужен, используется плагин auth.client.ts
  },
})

