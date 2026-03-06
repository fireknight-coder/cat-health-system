import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { installMock } from '@/api/mock'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore().logout()
    }
    return Promise.reject(err)
  }
)

if (import.meta.env.VITE_USE_MOCK === 'true') {
  installMock(request)
}

export default request
