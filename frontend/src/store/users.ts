import { defineStore } from 'pinia'
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from '~/types/user'
import { useToast } from '~/composables/useToast'

type UsersState = {
  users: User[]
  loading: boolean
  error: string | null
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: [],
    loading: false,
    error: null,
  }),

  actions: {
    async createUser(dto: CreateUserDto) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const newUser = await $api.post<User>('/users', dto)
        this.users.unshift(newUser)
        success('Пользователь успешно создан')
        return newUser
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка создания пользователя'
        this.error = errorMessage
        showError(`Ошибка создания пользователя: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchUsers() {
      if (this.loading) return

      this.loading = true
      this.error = null
      const { error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const users = await $api.get<User[]>('/users')
        this.users = users
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки пользователей'
        this.error = errorMessage
        showError(`Ошибка загрузки пользователей: ${errorMessage}`)
      } finally {
        this.loading = false
      }
    },

    async updateUser(userId: string, dto: UpdateUserDto) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const updatedUser = await $api.patch<User>(`/users/${userId}`, dto)

        // Обновляем пользователя в списке
        const index = this.users.findIndex((u) => u.id === userId)
        if (index !== -1) {
          this.users[index] = updatedUser
        }

        success('Пользователь успешно обновлен')
        return updatedUser
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка обновления пользователя'
        this.error = errorMessage
        showError(`Ошибка обновления пользователя: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateUserRole(userId: string, role: UpdateUserRoleDto['role']) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        const updatedUser = await $api.patch<User>(`/users/${userId}/role`, {
          role,
        })

        // Обновляем пользователя в списке
        const index = this.users.findIndex((u) => u.id === userId)
        if (index !== -1) {
          this.users[index] = updatedUser
        }

        success('Роль пользователя успешно обновлена')
        return updatedUser
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка обновления роли'
        this.error = errorMessage
        showError(`Ошибка обновления роли: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteUser(userId: string) {
      this.loading = true
      this.error = null
      const { success, error: showError } = useToast()

      try {
        const { $api } = useNuxtApp()
        await $api.del(`/users/${userId}`)

        // Удаляем пользователя из списка
        this.users = this.users.filter((u) => u.id !== userId)

        success('Пользователь успешно удален')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления пользователя'
        this.error = errorMessage
        showError(`Ошибка удаления пользователя: ${errorMessage}`)
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})

