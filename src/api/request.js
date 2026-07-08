import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

/*
 * Axios 实例 — 封装 HTTP 请求的基础配置
 * - baseURL: '/api/v1'，所有请求自动添加此前缀
 * - timeout: 15000ms，超时自动中断
 */
const request = axios.create({ baseURL: '/api/v1', timeout: 15000 })

/*
 * 令牌刷新状态控制
 * isRefreshing — 防止并发刷新请求，同一时刻只允许一个刷新流程
 * refreshSubscribers — 队列中等待新令牌的请求回调
 */
let isRefreshing = false
let refreshSubscribers = []

/*
 * onRefreshed — 令牌刷新成功后，通知所有等待队列中的请求
 * 参数 token: 新的 access_token
 */
function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

/*
 * addRefreshSubscriber — 将请求加入等待队列，待令牌刷新后重试
 * 参数 cb: 接收到新令牌后的回调函数
 */
function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

/*
 * 请求拦截器 — 自动注入 Authorization 请求头
 * 从 localStorage 读取 access_token，若存在则添加 Bearer 前缀
 */
request.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/*
 * 响应拦截器 — 统一处理返回与错误
 *
 * 成功处理:
 * - code === 0：返回 res.data（剥离外层 axios 结构）
 * - code === 1001：令牌过期，清除登录态并跳转登录页
 * - 其他非零 code：抛出业务错误消息
 *
 * 错误处理（401 自动刷新令牌）:
 * - 收到 401 且未重试过：尝试使用 refresh_token 获取新 access_token
 * - 使用原始 axios.post 避免循环依赖（自身就在拦截器中）
 * - 若刷新成功：更新 localStorage，重放原始请求
 * - 若正在刷新：将请求加入等待队列，待新令牌到达后重试
 * - 刷新失败或没有 refresh_token：清除登录态并跳转登录页
 * - 网络/其他错误：通过 ElMessage 显示错误提示
 */
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
            const res = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken })
            if (res.data.code === 0 && res.data.data?.access_token) {
              const newToken = res.data.data.access_token
              localStorage.setItem('access_token', newToken)
              onRefreshed(newToken)
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return request(originalRequest)
            }
            refreshSubscribers.forEach(cb => cb(null))
            refreshSubscribers = []
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

/*
 * clearAuth — 清除本地存储中的全部认证信息
 * 移除项: access_token, refresh_token, user_role, user_id, user_name
 * 在令牌过期、刷新失败或登出时调用
 */
function clearAuth() {
  ;['access_token','refresh_token','user_role','user_id','user_name'].forEach(k => localStorage.removeItem(k))
}

export default request
