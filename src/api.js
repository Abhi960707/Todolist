import axios from 'axios'
import { getStoredToken, clearAuthSession } from './utils/auth'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API = axios.create({
  baseURL,
})

API.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    // Prevent auto-logout if the 401 error comes from login or password change
    if (error.response?.status === 401 && !url.includes('/login') && !url.includes('/change-password')) {
      clearAuthSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default API
