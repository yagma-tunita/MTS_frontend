import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({ baseURL: '/api/v1', timeout: 15000 })

let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

request.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  res => {
    if (res.data.code !== 0) {
      if (res.data.code === 1001) { clearAuth(); router.push('/login'); return Promise.reject(new Error('登录已过期')) }
      return Promise.reject(new Error(res.data.message || '请求失败'))
    }
    return res.data
  },
  async err => {
    const originalRequest = err.config
    if (err.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        originalRequest._retry = true
        if (!isRefreshing) {
          isRefreshing = true
          try {
            // Use raw axios.post to avoid circular dependency (this is the refresh interceptor itself)
            const res = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken })
            if (res.data.code === 0 && res.data.data?.access_token) {
              const newToken = res.data.data.access_token
              localStorage.setItem('access_token', newToken)
              onRefreshed(newToken)
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return request(originalRequest)
            }
          } catch {
            refreshSubscribers.forEach(cb => cb(null))
            refreshSubscribers = []
          } finally {
            isRefreshing = false
          }
        } else {
          return new Promise((resolve, reject) => {
            addRefreshSubscriber(token => {
              if (!token) { reject(new Error('登录已过期')); return }
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(request(originalRequest))
            })
          })
        }
      }
      clearAuth(); router.push('/login')
      return Promise.reject(new Error('登录已过期'))
    }
    const msg = err.response?.data?.message || err.message || '网络错误'
    ElMessage.error(msg)
    return Promise.reject(new Error(msg))
  }
)

function clearAuth() {
  ;['access_token','refresh_token','user_role','user_id','user_name'].forEach(k => localStorage.removeItem(k))
}

export default request
