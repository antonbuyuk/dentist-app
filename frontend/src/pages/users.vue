<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useUsersStore } from '~/store/users'
import { useAuthStore } from '~/store/auth'
import type { User, CreateUserDto, UpdateUserDto } from '~/types/user'

definePageMeta({
  middleware: ['auth', 'role'],
  allowedRoles: ['developer', 'rootUser', 'admin'],
})

const usersStore = useUsersStore()
const authStore = useAuthStore()

const isFormOpen = ref(false)
const isEditFormOpen = ref(false)
const editingUser = ref<User | null>(null)
const selectedRole = ref<string>('')
const searchQuery = ref('')
const roleFilter = ref<string>('')
const formData = ref<CreateUserDto>({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  medicalHistory: '',
  role: 'patient',
})

const editFormData = ref<UpdateUserDto>({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  medicalHistory: '',
  role: 'patient',
})

const roles = [
  { value: 'developer', label: 'Разработчик' },
  { value: 'rootUser', label: 'Root пользователь' },
  { value: 'admin', label: 'Администратор' },
  { value: 'doctor', label: 'Врач' },
  { value: 'patient', label: 'Пациент' },
]

const getRoleLabel = (role: string) => {
  return roles.find((r) => r.value === role)?.label || role
}

const filteredUsers = computed(() => {
  let filtered = usersStore.users

  // Фильтр по роли
  if (roleFilter.value) {
    filtered = filtered.filter((user) => user.role === roleFilter.value)
  }

  // Поиск по всем полям
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter((user) => {
      const searchableFields = [
        user.email,
        user.firstName,
        user.lastName,
        user.phone,
        user.address,
        user.medicalHistory,
        getRoleLabel(user.role),
      ]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase())

      return searchableFields.some((field) => field.includes(query))
    })
  }

  return filtered
})

const formatDateForInput = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const handleEditRole = (user: User) => {
  editingUser.value = user
  selectedRole.value = user.role
}

const handleSaveRole = async () => {
  if (!editingUser.value) return

  try {
    await usersStore.updateUserRole(
      editingUser.value.id,
      selectedRole.value as any,
    )
    editingUser.value = null
    selectedRole.value = ''
  } catch (error) {
    console.error('Ошибка при обновлении роли:', error)
  }
}

const handleCancelEdit = () => {
  editingUser.value = null
  selectedRole.value = ''
}

const handleAdd = () => {
  editingUser.value = null
  formData.value = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    medicalHistory: '',
    role: 'patient',
  }
  isFormOpen.value = true
}

const handleEdit = (user: User) => {
  editingUser.value = user
  editFormData.value = {
    email: user.email,
    password: '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    dateOfBirth: formatDateForInput(user.dateOfBirth),
    address: user.address || '',
    medicalHistory: user.medicalHistory || '',
    role: user.role as any,
  }
  isEditFormOpen.value = true
}

const handleFormSubmit = async () => {
  try {
    await usersStore.createUser(formData.value)
    await usersStore.fetchUsers() // Обновляем список после создания
    isFormOpen.value = false
    formData.value = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      medicalHistory: '',
      role: 'patient',
    }
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error)
  }
}

const handleEditFormSubmit = async () => {
  if (!editingUser.value) return

  try {
    // Удаляем пустой пароль из данных обновления
    const updateData: UpdateUserDto = { ...editFormData.value }
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password
    }
    await usersStore.updateUser(editingUser.value.id, updateData)
    await usersStore.fetchUsers() // Обновляем список после редактирования
    isEditFormOpen.value = false
    editingUser.value = null
    editFormData.value = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      medicalHistory: '',
      role: 'patient',
    }
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error)
  }
}

const handleFormClose = () => {
  isFormOpen.value = false
  formData.value = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    medicalHistory: '',
    role: 'patient',
  }
}

const handleEditFormClose = () => {
  isEditFormOpen.value = false
  editingUser.value = null
  editFormData.value = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    medicalHistory: '',
    role: 'patient',
  }
}

const handleDelete = async (userId: string) => {
  if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
    return
  }

  try {
    await usersStore.deleteUser(userId)
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error)
  }
}

onMounted(() => {
  usersStore.fetchUsers()
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">
          Управление пользователями
        </h1>
        <p class="text-gray-600 mt-2">
          Просмотр и управление пользователями системы
        </p>
      </div>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        @click="handleAdd"
      >
        + Добавить пользователя
      </button>
    </div>

    <div
      v-if="usersStore.loading"
      class="text-center py-8"
    >
      <div class="text-gray-600">
        Загрузка пользователей...
      </div>
    </div>

    <div
      v-else-if="usersStore.error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
    >
      <div class="text-red-800">
        {{ usersStore.error }}
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
              placeholder="Поиск по email, имени, телефону, адресу..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
          <div class="sm:w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Фильтр по роли
            </label>
            <select
              v-model="roleFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                Все роли
              </option>
              <option
                v-for="role in roles"
                :key="role.value"
                :value="role.value"
              >
                {{ role.label }}
              </option>
            </select>
          </div>
        </div>
        <div
          v-if="searchQuery || roleFilter"
          class="mt-2 text-sm text-gray-600"
        >
          Найдено пользователей: {{ filteredUsers.length }}
        </div>
      </div>

      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Имя
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Телефон
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Роль
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Дата регистрации
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
            v-for="user in filteredUsers"
            :key="user.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ user.email }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ user.firstName || '-' }} {{ user.lastName || '' }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">
                {{ user.phone || '-' }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div
                v-if="editingUser?.id === user.id"
                class="flex items-center gap-2"
              >
                <select
                  v-model="selectedRole"
                  class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option
                    v-for="role in roles"
                    :key="role.value"
                    :value="role.value"
                  >
                    {{ role.label }}
                  </option>
                </select>
                <button
                  class="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  @click="handleSaveRole"
                >
                  Сохранить
                </button>
                <button
                  class="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                  @click="handleCancelEdit"
                >
                  Отмена
                </button>
              </div>
              <div v-else>
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="{
                    'bg-purple-100 text-purple-800': user.role === 'developer',
                    'bg-red-100 text-red-800': user.role === 'rootUser',
                    'bg-blue-100 text-blue-800': user.role === 'admin',
                    'bg-green-100 text-green-800': user.role === 'doctor',
                    'bg-gray-100 text-gray-800': user.role === 'patient',
                  }"
                >
                  {{ getRoleLabel(user.role) }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(user.createdAt).toLocaleDateString('ru-RU') }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="editingUser?.id !== user.id"
                  class="text-blue-600 hover:text-blue-900"
                  @click="handleEdit(user)"
                >
                  Редактировать
                </button>
                <button
                  v-if="editingUser?.id !== user.id"
                  class="text-purple-600 hover:text-purple-900"
                  @click="handleEditRole(user)"
                >
                  Изменить роль
                </button>
                <button
                  v-if="user.id !== authStore.user?.id"
                  class="text-red-600 hover:text-red-900"
                  @click="handleDelete(user.id)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="filteredUsers.length === 0"
        class="text-center py-8 text-gray-500"
      >
        <div v-if="usersStore.users.length === 0">
          Пользователи не найдены
        </div>
        <div v-else>
          Пользователи не найдены по заданным критериям поиска
        </div>
      </div>
    </div>

    <!-- Модальное окно создания пользователя -->
    <div
      v-if="isFormOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      @click.self="handleFormClose"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl my-8">
        <h2 class="text-2xl font-semibold mb-4">
          Добавить пользователя
        </h2>

        <form @submit.prevent="handleFormSubmit">
          <div class="grid grid-cols-2 gap-4">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                v-model="formData.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Пароль *
              </label>
              <input
                v-model="formData.password"
                type="password"
                required
                minlength="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                v-model="formData.firstName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                v-model="formData.lastName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                v-model="formData.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Дата рождения
              </label>
              <input
                v-model="formData.dateOfBirth"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4 col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Адрес
              </label>
              <input
                v-model="formData.address"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4 col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                История болезней
              </label>
              <textarea
                v-model="formData.medicalHistory"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="mb-6 col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Роль *
              </label>
              <select
                v-model="formData.role"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option
                  v-for="role in roles"
                  :key="role.value"
                  :value="role.value"
                >
                  {{ role.label }}
                </option>
              </select>
            </div>
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

    <!-- Модальное окно редактирования пользователя -->
    <div
      v-if="isEditFormOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      @click.self="handleEditFormClose"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl my-8">
        <h2 class="text-2xl font-semibold mb-4">
          Редактировать пользователя
        </h2>

        <form @submit.prevent="handleEditFormSubmit">
          <div class="grid grid-cols-2 gap-4">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                v-model="editFormData.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Пароль (оставьте пустым, чтобы не менять)
              </label>
              <input
                v-model="editFormData.password"
                type="password"
                minlength="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                v-model="editFormData.firstName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                v-model="editFormData.lastName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                v-model="editFormData.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Дата рождения
              </label>
              <input
                v-model="editFormData.dateOfBirth"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4 col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Адрес
              </label>
              <input
                v-model="editFormData.address"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="mb-4 col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                История болезней
              </label>
              <textarea
                v-model="editFormData.medicalHistory"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="mb-6 col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Роль *
              </label>
              <select
                v-model="editFormData.role"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option
                  v-for="role in roles"
                  :key="role.value"
                  :value="role.value"
                >
                  {{ role.label }}
                </option>
              </select>
            </div>
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
