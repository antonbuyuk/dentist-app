<script setup lang="ts">
import type { Doctor, CreateDoctorDto } from '~/types/doctor'

type Props = {
  doctor?: Doctor | null
  isOpen: boolean
}

type Emits = {
  (e: 'close'): void
  (e: 'submit', data: CreateDoctorDto): void
}

const props = withDefaults(defineProps<Props>(), {
  doctor: null,
  isOpen: false
})

const emit = defineEmits<Emits>()

const form = ref<CreateDoctorDto>({
  firstName: '',
  lastName: '',
  specialization: '',
  email: '',
  phone: ''
})

const errors = ref<Partial<Record<keyof CreateDoctorDto, string>>>({})

const resetForm = () => {
  if (props.doctor) {
    form.value = {
      firstName: props.doctor.firstName,
      lastName: props.doctor.lastName,
      specialization: props.doctor.specialization || '',
      email: props.doctor.email || '',
      phone: props.doctor.phone || ''
    }
  } else {
    form.value = {
      firstName: '',
      lastName: '',
      specialization: '',
      email: '',
      phone: ''
    }
  }
  errors.value = {}
}

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.firstName.trim()) {
    errors.value.firstName = 'Имя обязательно'
  }

  if (!form.value.lastName.trim()) {
    errors.value.lastName = 'Фамилия обязательна'
  }

  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Неверный формат email'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validate()) return

  emit('submit', form.value)
  emit('close')
}

const handleClose = () => {
  resetForm()
  emit('close')
}

watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
  }
})

watch(() => props.doctor, () => {
  if (props.isOpen) {
    resetForm()
  }
}, { immediate: true })
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">
            {{ doctor ? 'Редактировать врача' : 'Новый врач' }}
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 text-2xl"
            @click="handleClose"
          >
            ×
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Имя <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.firstName"
                type="text"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.firstName }"
                placeholder="Введите имя"
              />
              <p v-if="errors.firstName" class="text-red-500 text-sm mt-1">
                {{ errors.firstName }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Фамилия <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.lastName"
                type="text"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.lastName }"
                placeholder="Введите фамилию"
              />
              <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">
                {{ errors.lastName }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Специализация
            </label>
            <input
              v-model="form.specialization"
              type="text"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Терапевт, Хирург"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.email }"
                placeholder="email@example.com"
              />
              <p v-if="errors.email" class="text-red-500 text-sm mt-1">
                {{ errors.email }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              @click="handleClose"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {{ doctor ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

