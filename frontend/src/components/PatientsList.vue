<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePatientsStore } from '~/store/patients';
import type { Patient, CreatePatientDto } from '~/types/patient';
import PatientForm from '~/components/PatientForm.vue';

const store = usePatientsStore();
const searchQuery = ref('');
const sortField = ref<keyof Patient>('lastName');
const sortDirection = ref<'asc' | 'desc'>('asc');
const isFormOpen = ref(false);
const editingPatient = ref<Patient | null>(null);

const filteredAndSortedPatients = computed(() => {
  if (!Array.isArray(store.patients)) {
    return [];
  }

  let filtered = store.patients;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.phone?.includes(query),
    );
  }

  return [...filtered].sort((a, b) => {
    const field: keyof Patient = sortField.value;
    const aVal = String(a[field] ?? '');
    const bVal = String(b[field] ?? '');
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
});

const toggleSort = (field: keyof Patient) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
};

const handleDelete = async (id: string) => {
  if (confirm('Вы уверены, что хотите удалить этого пациента?')) {
    await store.deletePatient(id);
  }
};

const handleAdd = () => {
  editingPatient.value = null;
  isFormOpen.value = true;
};

const handleEdit = (patient: Patient) => {
  editingPatient.value = patient;
  isFormOpen.value = true;
};

const handleFormSubmit = async (data: CreatePatientDto) => {
  try {
    if (editingPatient.value) {
      await store.updatePatient(editingPatient.value.id, data);
    } else {
      await store.createPatient(data);
    }
    // Обновляем список после создания/обновления
    await store.fetchPatients();
    isFormOpen.value = false;
    editingPatient.value = null;
  } catch {
    // Ошибка обрабатывается в store
  }
};

const handleFormClose = () => {
  isFormOpen.value = false;
  editingPatient.value = null;
};

onMounted(async () => {
  await store.fetchPatients();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-semibold">
        Пациенты
      </h2>
      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск..."
          class="rounded border border-gray-300 px-3 py-2"
        >
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
      v-else-if="filteredAndSortedPatients.length === 0"
      class="text-center py-8 text-gray-500"
    >
      Пациенты не найдены
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
          <th class="border border-gray-300 px-4 py-2 text-left">
            Email
          </th>
          <th class="border border-gray-300 px-4 py-2 text-left">
            Телефон
          </th>
          <th class="border border-gray-300 px-4 py-2 text-left">
            Дата рождения
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="patient in filteredAndSortedPatients"
          :key="patient.id"
          class="hover:bg-gray-50"
        >
          <td class="border border-gray-300 px-4 py-2">
            {{ patient.lastName }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            {{ patient.firstName }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            {{ patient.email || '-' }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            {{ patient.phone || '-' }}
          </td>
          <td class="border border-gray-300 px-4 py-2">
            {{ patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('ru-RU') : '-' }}
          </td>
        </tr>
      </tbody>
    </table>

    <PatientForm
      :patient="editingPatient"
      :is-open="isFormOpen"
      @close="handleFormClose"
      @submit="handleFormSubmit"
    />
  </div>
</template>

