<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useNotificationsStore } from '~/store/notifications'
import { useAuthStore } from '~/store/auth'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()

const isOpen = ref(false)

const unreadNotifications = computed(() => {
  return notificationsStore.notifications.filter((n) => !n.read)
})

const readNotifications = computed(() => {
  return notificationsStore.notifications.filter((n) => n.read).slice(0, 10)
})

const formatTime = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ru,
    })
  } catch {
    return ''
  }
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'appointment_created':
      return '📅'
    case 'appointment_updated':
      return '✏️'
    case 'appointment_cancelled':
      return '❌'
    case 'appointment_reminder':
      return '🔔'
    default:
      return '📢'
  }
}

const handleMarkAsRead = async (id: string) => {
  await notificationsStore.markAsRead([id])
}

const handleMarkAllAsRead = async () => {
  await notificationsStore.markAllAsRead()
}

const handleDelete = async (id: string) => {
  await notificationsStore.deleteNotification(id)
}

// Обновляем уведомления каждые 30 секунд
let intervalId: NodeJS.Timeout | null = null

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await notificationsStore.fetchNotifications()
    await notificationsStore.fetchUnreadCount()

    // Настраиваем автоматическое обновление счётчика каждые 30 секунд
    intervalId = setInterval(async () => {
      await notificationsStore.fetchUnreadCount()
    }, 30000)
  }
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <div class="relative">
    <button
      class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      @click="isOpen = !isOpen"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span
        v-if="notificationsStore.unreadCount > 0"
        class="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
      >
        {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col"
      @click.stop
    >
      <div class="p-4 border-b flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">
          Уведомления
        </h3>
        <div class="flex gap-2">
          <button
            v-if="unreadNotifications.length > 0"
            class="text-sm text-blue-600 hover:text-blue-800"
            @click="handleMarkAllAsRead"
          >
            Отметить все как прочитанные
          </button>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="isOpen = false"
          >
            ×
          </button>
        </div>
      </div>

      <div class="overflow-y-auto flex-1">
        <div v-if="notificationsStore.notifications.length === 0" class="p-4 text-center text-gray-500">
          Нет уведомлений
        </div>

        <div v-if="unreadNotifications.length > 0" class="border-b">
          <div
            v-for="notification in unreadNotifications"
            :key="notification.id"
            class="p-4 border-b hover:bg-gray-50 cursor-pointer"
            :class="{ 'bg-blue-50': !notification.read }"
            @click="handleMarkAsRead(notification.id)"
          >
            <div class="flex items-start gap-3">
              <span class="text-2xl">{{ getNotificationIcon(notification.type) }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-medium text-gray-900">
                    {{ notification.title }}
                  </h4>
                  <button
                    class="text-gray-400 hover:text-gray-600 text-sm"
                    @click.stop="handleDelete(notification.id)"
                  >
                    ×
                  </button>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-400 mt-2">
                  {{ formatTime(notification.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="readNotifications.length > 0">
          <div
            v-for="notification in readNotifications"
            :key="notification.id"
            class="p-4 border-b hover:bg-gray-50 cursor-pointer"
          >
            <div class="flex items-start gap-3">
              <span class="text-2xl opacity-50">{{ getNotificationIcon(notification.type) }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-medium text-gray-600">
                    {{ notification.title }}
                  </h4>
                  <button
                    class="text-gray-400 hover:text-gray-600 text-sm"
                    @click.stop="handleDelete(notification.id)"
                  >
                    ×
                  </button>
                </div>
                <p class="text-sm text-gray-500 mt-1">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-400 mt-2">
                  {{ formatTime(notification.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Стили для скроллбара */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

