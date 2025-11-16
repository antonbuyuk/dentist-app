import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref<number>(0)
  const double = computed(() => count.value * 2)

  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => { count.value = 0 }

  return {
    count,
    double,
    increment,
    decrement,
    reset
  }
})


