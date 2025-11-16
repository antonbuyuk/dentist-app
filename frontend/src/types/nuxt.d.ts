import type { ApiClient } from '~/plugins/api'

declare module '#app' {
  interface NuxtApp {
    $api: ApiClient
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: ApiClient
  }
}

declare module '@pinia/nuxt' {
  interface PiniaCustomProperties {
    $api: ApiClient
  }
}

export {}


