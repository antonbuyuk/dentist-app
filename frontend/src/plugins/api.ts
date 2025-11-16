type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type RequestOptions = {
  body?: unknown
  query?: Record<string, any>
  headers?: Record<string, string>
}

const createRequest = (baseURL: string) => {
  const request = async <T>(url: string, method: ApiMethod, options: RequestOptions = {}) => {
    const token = useCookie<string | null>('access_token').value
    const headers: Record<string, string> = { ...(options.headers || {}) }
    if (token) headers.Authorization = `Bearer ${token}`

    const data = await $fetch<T>(url, {
      baseURL,
      method,
      headers,
      body: options.body as any,
      query: options.query,
      credentials: 'include',
    })

    if (data === null || data === undefined) {
      return [] as T
    }

    return data as T
  }

  return {
    get:  <T>(url: string, options?: RequestOptions) => request<T>(url, 'GET', options),
    post: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>(url, 'POST', { ...options, body }),
    patch:<T>(url: string, body?: unknown, options?: RequestOptions) => request<T>(url, 'PATCH', { ...options, body }),
    del:  <T>(url: string, options?: RequestOptions) => request<T>(url, 'DELETE', options)
  }
}

export type ApiClient = ReturnType<typeof createRequest>

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const api = createRequest(config.public.apiBase)
  return {
    provide: {
      api
    }
  }
})

export const useApi = () => {
  const { $api } = useNuxtApp()
  return $api
}


