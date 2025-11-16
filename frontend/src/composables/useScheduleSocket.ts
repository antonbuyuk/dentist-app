import { computed, watch } from 'vue'
import { useWebSocket } from '@vueuse/core'
import type { ScheduleEvent } from '~/types/schedule'

export const useScheduleSocket = () => {
  const config = useRuntimeConfig()
  const wsUrl = computed(() => config.public.apiBase.replace(/^http/, 'ws') + '/ws')

  const { status, send, open, close, data } = useWebSocket(wsUrl, {
    autoReconnect: { retries: 10, delay: 1000 }
  })

  const emitUpdate = (event: ScheduleEvent) => {
    send(JSON.stringify({ channel: 'schedule:update', payload: event }))
  }

  const onUpdated = (cb: (event: ScheduleEvent) => void) => {
    watch(data, (val) => {
      if (!val) return
      try {
        const msg = JSON.parse(val as string)
        if (msg?.[0] === 'schedule:updated') cb(msg[1] as ScheduleEvent)
      } catch {}
    }, { immediate: false })
  }

  return {
    status,
    open,
    close,
    emitUpdate,
    onUpdated
  }
}


