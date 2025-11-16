<script setup lang="ts">
import { useToast, type ToastType } from '~/composables/useToast'

const { toasts, removeToast } = useToast()

const getToastStyles = (type: ToastType) => {
  const styles: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }
  return styles[type] || styles.info
}

const getIcon = (type: ToastType) => {
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }
  return icons[type] || icons.info
}
</script>

<template>
  <div
    class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full"
  >
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-2"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-start gap-3 p-4 rounded-lg border shadow-lg"
        :class="getToastStyles(toast.type)"
      >
        <div class="flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold">
          {{ getIcon(toast.type) }}
        </div>
        <div class="flex-1 text-sm">
          {{ toast.message }}
        </div>
        <button
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          @click="removeToast(toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>

