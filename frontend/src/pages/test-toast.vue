<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { success, error, warning, info } = useToast()

const showSuccess = () => {
  success('Это успешное уведомление!')
}

const showError = () => {
  error('Это уведомление об ошибке!')
}

const showWarning = () => {
  warning('Это предупреждение!')
}

const showInfo = () => {
  info('Это информационное уведомление!')
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">
      Тест системы уведомлений
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      <button
        class="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        @click="showSuccess"
      >
        Показать Success
      </button>

      <button
        class="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        @click="showError"
      >
        Показать Error
      </button>

      <button
        class="px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
        @click="showWarning"
      >
        Показать Warning
      </button>

      <button
        class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        @click="showInfo"
      >
        Показать Info
      </button>
    </div>

    <div class="mt-8 p-4 bg-gray-100 rounded-lg">
      <h2 class="text-xl font-semibold mb-2">
        Как проверить через консоль браузера:
      </h2>
      <ol class="list-decimal list-inside space-y-2 text-sm">
        <li>Откройте консоль разработчика (F12)</li>
        <li>В консоли выполните:</li>
      </ol>
      <pre class="mt-2 p-3 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto"><code>// Получить доступ к useToast
const toast = useNuxtApp().$useToast?.() || window.$nuxt?.$useToast?.()

// Или через глобальный объект (если доступен)
// const { success, error, warning, info } = useToast()

// Показать уведомления:
toast?.success('Тест успеха')
toast?.error('Тест ошибки')
toast?.warning('Тест предупреждения')
toast?.info('Тест информации')</code></pre>
    </div>

    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
      <h2 class="text-xl font-semibold mb-2">
        Проверка через реальные операции:
      </h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Создание:</strong> Создайте нового пациента/врача/приём - увидите уведомление об успехе
        </li>
        <li>
          <strong>Обновление:</strong> Отредактируйте существующую запись - увидите уведомление об успехе
        </li>
        <li>
          <strong>Удаление:</strong> Удалите запись - увидите уведомление об успехе
        </li>
        <li>
          <strong>Ошибки:</strong> Попробуйте создать запись с невалидными данными - увидите уведомление об ошибке
        </li>
      </ul>
    </div>
  </div>
</template>

