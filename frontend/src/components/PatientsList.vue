<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUsersStore } from '~/store/users';
import type { User } from '~/types/user';

const usersStore = useUsersStore();
const searchQuery = ref('');
const sortField = ref<keyof User>('lastName');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Фильтруем только пользователей с ролью 'patient'
const patients = computed(() => {
  return usersStore.users.filter((user) => user.role === 'patient');
});

const filteredAndSortedPatients = computed(() => {
  if (!Array.isArray(patients.value)) {
    return [];
  }

  let filtered = patients.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.firstName?.toLowerCase().includes(query) ||
        p.lastName?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.phone?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query),
    );
  }

  return [...filtered].sort((a, b) => {
    const field: keyof User = sortField.value;
    const aVal = String(a[field] ?? '');
    const bVal = String(b[field] ?? '');
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
});

const toggleSort = (field: keyof User) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
};

onMounted(async () => {
  await usersStore.fetchUsers();
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
          placeholder="Поиск по имени, email, телефону, адресу..."
          class="rounded border border-gray-300 px-3 py-2"
        >
      </div>
    </div>

    <div
      v-if="usersStore.loading"
      class="text-center py-8"
    >
      Загрузка...
    </div>

    <div
      v-else-if="usersStore.error"
      class="rounded bg-red-100 p-4 text-red-700"
    >
      {{ usersStore.error }}
    </div>

    <div
      v-else-if="filteredAndSortedPatients.length === 0"
      class="text-center py-8 text-gray-500"
    >
      <div v-if="patients.length === 0">
        Пациенты не найдены
      </div>
      <div v-else>
        Пациенты не найдены по заданным критериям поиска
      </div>
    </div>

    <div
      v-else
      class="bg-white rounded-lg shadow overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300">
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
                @click="toggleSort('email')"
              >
                Email
                <span v-if="sortField === 'email'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th class="border border-gray-300 px-4 py-2 text-left">
                Телефон
              </th>
              <th class="border border-gray-300 px-4 py-2 text-left">
                Дата рождения
              </th>
              <th class="border border-gray-300 px-4 py-2 text-left">
                Адрес
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
                {{ patient.lastName || '-' }}
              </td>
              <td class="border border-gray-300 px-4 py-2">
                {{ patient.firstName || '-' }}
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
              <td class="border border-gray-300 px-4 py-2">
                {{ patient.address || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

