<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  allowedRoles: ['developer', 'rootUser', 'admin'],
})
</script>

<template>
  <div>
    <PatientsList />
  </div>
</template>

