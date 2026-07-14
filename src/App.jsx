import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Signup from './components/Signup'
import Login from './components/Login'
import Todolist from './components/Todolist'
import UserProfile from './components/UserProfile'
import Notifications from './components/Notifications'
import Settings from './components/Settings'
import TaskDetailPage from './components/TaskDetailPage'
import NotificationDetailPage from './components/NotificationDetailPage'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'


function App() {
  return (
  
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
        <Route path="/todolist" element={<ProtectedRoute><Todolist /></ProtectedRoute>} />
        <Route path="/user/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/task/:id" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />
        <Route path="/notification/:id" element={<ProtectedRoute><NotificationDetailPage /></ProtectedRoute>} />
        <Route path="*" element= {<div className='ml-165 pt-90 text-3xl font-black'>PAge Not Fount</div>}/>
        <Route path="/404" element={<ProtectedRoute>  </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
