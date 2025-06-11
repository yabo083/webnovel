import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        // 未授权，清除token并跳转登录
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
      
      // 显示错误消息
      const message = data.message || '请求失败'
      ElMessage.error(message)
    } else {
      ElMessage.error('网络错误，请检查您的连接')
    }
    
    return Promise.reject(error)
  }
)

export default api 