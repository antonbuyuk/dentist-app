<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDoctorsStore } from '~/store/doctors';
import type { Doctor, CreateDoctorDto } from '~/types/doctor';
import DoctorForm from '~/components/DoctorForm.vue';

const store = useDoctorsStore();
const searchQuery = ref('');
const sortField = ref<keyof Doctor>('lastName');
const sortDirection = ref<'asc' | 'desc'>('asc');
const isFormOpen = ref(false);
const editingDoctor = ref<Doctor | null>(null);

const filteredAndSortedDoctors = computed(() => {
  if (!Array.isArray(store.doctors)) {
    return [];
  }

  let filtered = store.doctors;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.firstName.toLowerCase().includes(query) ||
        d.lastName.toLowerCase().includes(query) ||
        d.specialization?.toLowerCase().includes(query) ||
        d.email?.toLowerCase().includes(query) ||
        d.phone?.includes(query),
    );
  }

  return [...filtered].sort((a, b) => {
    const field: keyof Doctor = sortField.value;
    const aVal = String(a[field] ?? '');
    const bVal = String(b[field] ?? '');
    const comparison = aVal.localeCompare(bVal);
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
});

const toggleSort = (field: keyof Doctor) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
};

const handleDelete = async (id: string) => {
  if (confirm('Вы уверены, что хотите удалить этого врача?')) {
    await store.deleteDoctor(id);
  }
};

const handleAdd = () => {
  editingDoctor.value = null;
  isFormOpen.value = true;
};

const handleEdit = (doctor: Doctor) => {
  editingDoctor.value = doctor;
  isFormOpen.value = true;
};

const handleFormSubmit = async (data: CreateDoctorDto) => {
  try {
    if (editingDoctor.value) {
      await store.updateDoctor(editingDoctor.value.id, data);
    } else {
      await store.createDoctor(data);
    }
    // Обновляем список после создания/обновления
    await store.fetchDoctors();
    isFormOpen.value = false;
    editingDoctor.value = null;
  } catch {
    // Ошибка обрабатывается в store
  }
};

const handleFormClose = () => {
  isFormOpen.value = false;
  editingDoctor.value = null;
};

onMounted(async () => {
  await store.fetchDoctors();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-semibold">
        Врачи
      </h2>
      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск..."
          class="rounded border border-gray-300 px-3 py-2"
        >
        <button
          class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          @click="handleAdd"
        >
          Добавить врача
        </button>
      </div>
    </div>

    <div
      v-if="store.loading"
      class="text-center py-8"
    >
      Загрузка...
    </div>

    <div
      v-else-if="store.error"
      class="rounded bg-red-100 p-4 text-red-700"
    >
      {{ store.error }}
    </div>

    <div
      v-else-if="filteredAndSortedDoctors.length === 0"
      class="text-center py-8 text-gray-500"
    >
      Врачи не найдены
    </div>

    <table
      v-else
      class="w-full border-collapse border border-gray-300"
    >
      <thead>
        <tr class="bg-gray-100">
          <th
            class="cursor-pointer border border-gray-300 px-4 py-2 text-left hover:bg-gray-200"
            @click="toggleSort('lastName')"
          >
            Фамилия
            <span v-if="sortField === 'lastName'">
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
          <th
            class="cursor-pointer border border-gray-300 px-4 py-2 text-left hover:bg-gray-200"
            @click="toggleSort('firstName')"
          >
            Имя
            <span v-if="sortField === 'firstName'">
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
          <th
            class="cursor-pointer border border-gray-300 px-4 py-2 text-left hover:bg-gray-200"
            @click="toggleSort('specialization')"
          >
            Специализация
            <span v-if="sortField === 'specialization'">
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
          <th class="border border-gray-300 px-4 py-2 text-left">
            Email
          </th>
          <th class="border border-gray-300 px-4 py-2 text-left">
            Телефон
          </th>
          <th class="border border-gray-300 px-4 py-2 text-left">
            Действия
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="doctor in filteredAndSortedDoctors"
          :key="doctor.id"
          class="hover:bg-gray-50"
        >
          <td class="border border-gray-300 px-4 py-2">
            {{ doctor.lastName }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            {{ doctor.firstName }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            {{ doctor.specialization || '-' }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            {{ doctor.email || '-' }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            {{ doctor.phone || '-' }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            <div class="flex gap-2">
              <button
                class="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                @click="handleEdit(doctor)"
              >
                Редактировать
              </button>
              <button
                class="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                @click="handleDelete(doctor.id)"
              >
                Удалить
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <DoctorForm
      :doctor="editingDoctor"
      :is-open="isFormOpen"
      @close="handleFormClose"
      @submit="handleFormSubmit"
    />
  </div>
</template>

