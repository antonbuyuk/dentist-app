/// <reference types="node" />
import { resolve } from 'pathe'
import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'src',
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: [
    '~/assets/css/tailwind.css'
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001'
    }
  },
  alias: {
    '@': resolve('./src'),
    'vue': resolve('../node_modules/vue')
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          'vue': ['../node_modules/vue'],
          'vue/*': ['../node_modules/vue/*']
        }
      }
    }
  },
  devServer: {
    port: 3000
  },
  ssr: false
})
