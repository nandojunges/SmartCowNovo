import axios from 'axios'

// Base vazia: os SDKs e telas chamam caminhos começando com '/api/...'
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || '' })

// injeta token (se houver)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// trata 401/403 de forma centralizada
api.interceptors.response.use(
  res => res,
  err => {
    const status = err?.response?.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('token')
      // opcional: redirecionar para login
      // window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
