<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useWorkplacesStore } from '~/store/workplaces'
import { useDoctorsStore } from '~/store/doctors'
import type { Workplace, CreateWorkplaceDto, UpdateWorkplaceDto } from '~/types/workplace'

definePageMeta({
  middleware: ['auth', 'role'],
  allowedRoles: ['developer', 'rootUser', 'admin'],
})

const workplacesStore = useWorkplacesStore()
const doctorsStore = useDoctorsStore()

const isFormOpen = ref(false)
const isEditFormOpen = ref(false)
const editingWorkplace = ref<Workplace | null>(null)
const searchQuery = ref('')
const typeFilter = ref<string>('')

const formData = ref<CreateWorkplaceDto>({
  name: '',
  description: '',
  type: '',
  location: '',
  equipment: '',
  isActive: true,
})

const editFormData = ref<UpdateWorkplaceDto>({
  name: '',
  description: '',
  type: '',
  location: '',
  equipment: '',
  isActive: true,
})

const workplaceTypes = [
  { value: '', label: 'Все типы' },
  { value: 'кабинет', label: 'Кабинет' },
  { value: 'операционная', label: 'Операционная' },
  { value: 'рентген-кабинет', label: 'Рентген-кабинет' },
  { value: 'лаборатория', label: 'Лаборатория' },
  { value: 'другое', label: 'Другое' },
]

const filteredWorkplaces = computed(() => {
  let filtered = workplacesStore.workplaces

  // Фильтр по типу
  if (typeFilter.value) {
    filtered = filtered.filter(
      (workplace) => workplace.type === typeFilter.value,
    )
  }

  // Поиск по всем полям
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter((workplace) => {
      const searchableFields = [
        workplace.name,
        workplace.description,
        workplace.type,
        workplace.location,
        workplace.equipment,
      ]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase())

      return searchableFields.some((field) => field.includes(query))
    })
  }

  return filtered
})

const handleAdd = () => {
  editingWorkplace.value = null
  formData.value = {
    name: '',
    description: '',
    type: '',
    location: '',
    equipment: '',
    isActive: true,
  }
  isFormOpen.value = true
}

const handleEdit = (workplace: Workplace) => {
  editingWorkplace.value = workplace
  editFormData.value = {
    name: workplace.name,
    description: workplace.description || '',
    type: workplace.type || '',
    location: workplace.location || '',
    equipment: workplace.equipment || '',
    isActive: workplace.isActive,
  }
  isEditFormOpen.value = true
}

const handleFormSubmit = async () => {
  try {
    await workplacesStore.createWorkplace(formData.value)
    await workplacesStore.fetchWorkplaces()
    isFormOpen.value = false
    formData.value = {
      name: '',
      description: '',
      type: '',
      location: '',
      equipment: '',
      isActive: true,
    }
  } catch (error) {
    console.error('Ошибка при создании рабочего места:', error)
  }
}

const handleEditFormSubmit = async () => {
  if (!editingWorkplace.value) return

  try {
    await workplacesStore.updateWorkplace(
      editingWorkplace.value.id,
      editFormData.value,
    )
    await workplacesStore.fetchWorkplaces()
    isEditFormOpen.value = false
    editingWorkplace.value = null
    editFormData.value = {
      name: '',
      description: '',
      type: '',
      location: '',
      equipment: '',
      isActive: true,
    }
  } catch (error) {
    console.error('Ошибка при обновлении рабочего места:', error)
  }
}

const handleFormClose = () => {
  isFormOpen.value = false
  formData.value = {
    name: '',
    description: '',
    type: '',
    location: '',
    equipment: '',
    isActive: true,
  }
}

const handleEditFormClose = () => {
  isEditFormOpen.value = false
  editingWorkplace.value = null
  editFormData.value = {
    name: '',
    description: '',
    type: '',
    location: '',
    equipment: '',
    isActive: true,
  }
}

const handleDelete = async (workplaceId: string) => {
  if (!confirm('Вы уверены, что хотите удалить это рабочее место?')) {
    return
  }

  try {
    await workplacesStore.deleteWorkplace(workplaceId)
  } catch (error) {
    console.error('Ошибка при удалении рабочего места:', error)
  }
}

onMounted(async () => {
  await workplacesStore.fetchWorkplaces()
  await doctorsStore.fetchDoctors()
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">
          Рабочие места
        </h1>
        <p class="text-gray-600 mt-2">
          Управление рабочими местами для составления расписания
        </p>
      </div>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        @click="handleAdd"
      >
        + Добавить рабочее место
      </button>
    </div>

    <div
      v-if="workplacesStore.loading"
      class="text-center py-8"
    >
      <div class="text-gray-600">
        Загрузка рабочих мест...
      </div>
    </div>

    <div
      v-else-if="workplacesStore.error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
    >
      <div class="text-red-800">
        {{ workplacesStore.error }}
      </div>
    </div>

    <div
      v-else
      class="bg-white rounded-lg shadow overflow-hidden"
    >
      <!-- Поиск и фильтры -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Поиск
            </label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск по названию, описанию, типу, местоположению..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
          <div class="sm:w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Фильтр по типу
            </label>
            <select
              v-model="typeFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option
                v-for="type in workplaceTypes"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>
        </div>
        <div
          v-if="searchQuery || typeFilter"
          class="mt-2 text-sm text-gray-600"
        >
          Найдено рабочих мест: {{ filteredWorkplaces.length }}
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Название
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Тип
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Местоположение
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Описание
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Статус
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="workplace in filteredWorkplaces"
              :key="workplace.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ workplace.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">
                  {{ workplace.type || '-' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">
                  {{ workplace.location || '-' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-500 max-w-xs truncate">
                  {{ workplace.description || '-' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="{
                    'bg-green-100 text-green-800': workplace.isActive,
                    'bg-gray-100 text-gray-800': !workplace.isActive,
                  }"
                >
                  {{ workplace.isActive ? 'Активно' : 'Неактивно' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="text-blue-600 hover:text-blue-900"
                    @click="handleEdit(workplace)"
                  >
                    Редактировать
                  </button>
                  <button
                    class="text-red-600 hover:text-red-900"
                    @click="handleDelete(workplace.id)"
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="filteredWorkplaces.length === 0"
        class="text-center py-8 text-gray-500"
      >
        <div v-if="workplacesStore.workplaces.length === 0">
          Рабочие места не найдены
        </div>
        <div v-else>
          Рабочие места не найдены по заданным критериям поиска
        </div>
      </div>
    </div>

    <!-- Модальное окно создания рабочего места -->
    <div
      v-if="isFormOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="handleFormClose"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-semibold mb-4">
          Добавить рабочее место
        </h2>

        <form @submit.prevent="handleFormSubmit">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Тип
            </label>
            <select
              v-model="formData.type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                Выберите тип
              </option>
              <option value="кабинет">
                Кабинет
              </option>
              <option value="операционная">
                Операционная
              </option>
              <option value="рентген-кабинет">
                Рентген-кабинет
              </option>
              <option value="лаборатория">
                Лаборатория
              </option>
              <option value="другое">
                Другое
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Местоположение
            </label>
            <input
              v-model="formData.location"
              type="text"
              placeholder="Например: Кабинет №5, 2 этаж"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Оборудование
            </label>
            <textarea
              v-model="formData.equipment"
              rows="3"
              placeholder="Описание доступного оборудования"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="mb-6">
            <label class="flex items-center">
              <input
                v-model="formData.isActive"
                type="checkbox"
                class="mr-2"
              >
              <span class="text-sm font-medium text-gray-700">
                Активно
              </span>
            </label>
          </div>

          <div class="flex gap-3 justify-end">
            <button
              type="button"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              @click="handleFormClose"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно редактирования рабочего места -->
    <div
      v-if="isEditFormOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="handleEditFormClose"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-semibold mb-4">
          Редактировать рабочее место
        </h2>

        <form @submit.prevent="handleEditFormSubmit">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              v-model="editFormData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Тип
            </label>
            <select
              v-model="editFormData.type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                Выберите тип
              </option>
              <option value="кабинет">
                Кабинет
              </option>
              <option value="операционная">
                Операционная
              </option>
              <option value="рентген-кабинет">
                Рентген-кабинет
              </option>
              <option value="лаборатория">
                Лаборатория
              </option>
              <option value="другое">
                Другое
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Местоположение
            </label>
            <input
              v-model="editFormData.location"
              type="text"
              placeholder="Например: Кабинет №5, 2 этаж"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              v-model="editFormData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Оборудование
            </label>
            <textarea
              v-model="editFormData.equipment"
              rows="3"
              placeholder="Описание доступного оборудования"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="mb-6">
            <label class="flex items-center">
              <input
                v-model="editFormData.isActive"
                type="checkbox"
                class="mr-2"
              >
              <span class="text-sm font-medium text-gray-700">
                Активно
              </span>
            </label>
          </div>

          <div class="flex gap-3 justify-end">
            <button
              type="button"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              @click="handleEditFormClose"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

