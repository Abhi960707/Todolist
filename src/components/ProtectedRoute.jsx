import { isTokenValid } from '../utils/auth'
import { Navigate } from 'react-router-dom'

/**
 * ProtectedRoute — only shown to users with a valid (non-expired) token.
 * If the token is missing or expired (auto-cleared by isTokenValid) → redirect to /login.
 */
const ProtectedRoute = ({ children }) => {
  return isTokenValid() ? children : <Navigate to="/login" replace={true} />
}

export default ProtectedRoute
