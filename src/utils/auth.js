const AUTH_TOKEN_KEY = 'todo_auth_token'
const AUTH_USER_KEY = 'todo_auth_user'

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

export const getStoredUser = () => {
  const rawUser = localStorage.getItem(AUTH_USER_KEY)
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (normalized.length % 4)) % 4
  return atob(normalized.padEnd(normalized.length + padding, '='))
}

export const saveAuthSession = ({ token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export const isTokenValid = () => {
  const token = getStoredToken()
  if (!token) return false

  try {
    const payloadB64 = token.split('.')[1]
    if (!payloadB64) {
      clearAuthSession()
      return false
    }

    const json = decodeBase64Url(payloadB64)
    const { exp } = JSON.parse(json)
    const valid = typeof exp === 'number' && exp * 1000 > Date.now()

    if (!valid) {
      clearAuthSession()
    }

    return valid
  } catch {
    clearAuthSession()
    return false
  }
}
