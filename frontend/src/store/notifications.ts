import { defineStore } from 'pinia'
import type { Notification, MarkReadDto } from '~/types/notification'
import { useToast } from '~/composables/useToast'

type NotificationsState = {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
  }),

  actions: {
    async fetchNotifications() {
      if (this.loading) return
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const data = await $api.get<Notification[]>('/notifications')
        this.notifications = data
      } catch (error) {
        console.error('Ошибка при загрузке уведомлений:', error)
        useToast().error('Не удалось загрузить уведомления')
      } finally {
        this.loading = false
      }
    },

    async fetchUnreadCount() {
      try {
        const { $api } = useNuxtApp()
        const data = await $api.get<{ count: number }>('/notifications/unread-count')
        this.unreadCount = data.count
      } catch (error) {
        console.error('Ошибка при загрузке количества непрочитанных уведомлений:', error)
      }
    },

    async markAsRead(ids: string[]) {
      try {
        const { $api } = useNuxtApp()
        await $api.patch('/notifications/mark-read', { ids } as MarkReadDto)
        // Обновляем локальное состояние
        this.notifications.forEach((notification) => {
          if (ids.includes(notification.id)) {
            notification.read = true
          }
        })
        await this.fetchUnreadCount()
      } catch (error) {
        console.error('Ошибка при отметке уведомлений как прочитанных:', error)
        useToast().error('Не удалось отметить уведомления как прочитанные')
      }
    },

    async markAllAsRead() {
      try {
        const { $api } = useNuxtApp()
        await $api.patch('/notifications/mark-all-read')
        // Обновляем локальное состояние
        this.notifications.forEach((notification) => {
          notification.read = true
        })
        this.unreadCount = 0
      } catch (error) {
        console.error('Ошибка при отметке всех уведомлений как прочитанных:', error)
        useToast().error('Не удалось отметить все уведомления как прочитанные')
      }
    },

    async deleteNotification(id: string) {
      try {
        const { $api } = useNuxtApp()
        await $api.del(`/notifications/${id}`)
        this.notifications = this.notifications.filter((n) => n.id !== id)
        await this.fetchUnreadCount()
        useToast().success('Уведомление удалено')
      } catch (error) {
        console.error('Ошибка при удалении уведомления:', error)
        useToast().error('Не удалось удалить уведомление')
      }
    },
  },
})

