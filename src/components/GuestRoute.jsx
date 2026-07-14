import { isTokenValid } from '../utils/auth'
import { Navigate } from 'react-router-dom'

/**
 * GuestRoute — only shown to visitors who are NOT logged in.
 * If a valid (non-expired) token exists → redirect to the dashboard.
 * If the token is missing or expired (auto-cleared by isTokenValid) → show guest page.
 */
const GuestRoute = ({ children }) => {
  return isTokenValid() ? <Navigate to="/todolist" replace={true} /> : children
}

export default GuestRoute
