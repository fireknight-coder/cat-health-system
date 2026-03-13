import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { installMock } from '@/api/mock'


//创造专用请求对象，所有请求统一管理
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 15000,
})

//请求拦截器，lan'jie'suo'you
request.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})
//响应拦截器，处理所有响应
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

//导出请求对象，供全局使用
export default request
