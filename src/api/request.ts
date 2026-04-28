import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { installMock } from '@/api/mock'


//创造专用请求对象，所有请求统一管理
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? 'http://localhost:3002/api',
  timeout: 15000,
})

//请求拦截器，lan'jie'suo'you
request.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})
// 响应拦截器，处理所有响应
request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status
    if (status === 401 || status === 403) {
      const auth = useAuthStore()
      // 游客访问不需要强制跳转登录页，只提示即可
      if (!auth.token || auth.isGuest) {
        return Promise.reject(err)
      }
      auth.logout()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
    }
    return Promise.reject(err)
  }
)

if (import.meta.env.VITE_USE_MOCK === 'true') {
  installMock(request)
}

//导出请求对象，供全局使用
export default request
