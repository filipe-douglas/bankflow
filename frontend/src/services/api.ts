import axios, { AxiosError } from 'axios'
import type { ApiError } from '../types'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: injeta o access token em toda requisição ──────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: trata 401 — tenta refresh ou redireciona ─────────

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean }

    // Só tenta refresh em 401, e apenas uma vez por requisição
    if (error.response?.status === 401 && !original?._retry) {
      const refreshToken = localStorage.getItem('refreshToken')

      // Sem refresh token — vai direto para login
      if (!refreshToken) {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // Se já está fazendo refresh, enfileira a requisição
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original!.headers!.Authorization = `Bearer ${token}`
          return api(original!)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        // Usa axios diretamente (sem interceptors) para evitar loop infinito
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
        processQueue(null, data.accessToken)
        original!.headers!.Authorization = `Bearer ${data.accessToken}`
        return api(original!)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

/** Remove todos os dados de autenticação do localStorage. */
export function clearAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('bankflow-auth') // chave do Zustand persist
}

/** Extrai a mensagem de erro legível de uma resposta de erro da API. */
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined
    if (data?.errors) {
      return Object.values(data.errors).join('; ')
    }
    return data?.detail ?? data?.title ?? 'Ocorreu um erro. Tente novamente.'
  }
  return 'Ocorreu um erro inesperado.'
}