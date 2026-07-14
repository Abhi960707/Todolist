import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { getStoredUser, clearAuthSession } from '../utils/auth'

const Settings = () => {
  const navigate = useNavigate()
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [user, setUser] = useState(getStoredUser())
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [msg, setMsg] = useState({ text: '', ok: true })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

  // State for layout
  const [todos, setTodos] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true)
      try {
        const [userRes, todosRes, teamRes, notificationsRes] = await Promise.all([
          API.get('/auth/me'),
          API.get('/todo'),
          API.get('/auth/users'),
          API.get('/todo/notifications'),
        ])
        setUser(userRes.data.user)
        setTodos(todosRes.data)
        setTeamMembers(teamRes.data.users)
        setNotifications(notificationsRes.data)
      } catch (err) {
        console.error('Failed to fetch settings page data:', err)
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, []);

  // Stats for Sidebar
  const currentUserId = user?.id || user?._id
  const myTasks = todos.filter(
    (todo) =>
      todo.user?._id === currentUserId ||
      todo.user?.id === currentUserId ||
      todo.assignedTo?._id === currentUserId ||
      todo.assignedTo?.id === currentUserId
  )
  const assignedByMe = todos.filter(
    (todo) => (todo.assignedBy?._id === currentUserId || todo.assignedBy?.id === currentUserId) && todo.assignedTo,
  )
  const completed = todos.filter((todo) => todo.completed)
  const progress = todos.length ? Math.round((completed.length / todos.length) * 100) : 0
  const stats = {
    total: todos.length,
    progress,
    myTasks: myTasks.length,
    assignedByMe: assignedByMe.length,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg({ text: '', ok: true })

    if (!pwForm.currentPassword.trim() || !pwForm.newPassword.trim()) {
      setMsg({ text: 'All fields are required', ok: false })
      setTimeout(() => setMsg({ text: '', ok: true }), 3000)
      return
    }

    if (pwForm.newPassword.trim().length < 4) {
      setMsg({ text: 'New password must be at least 4 characters', ok: false })
      setTimeout(() => setMsg({ text: '', ok: true }), 3000)
      return
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setMsg({ text: 'New passwords do not match', ok: false })
      setTimeout(() => setMsg({ text: '', ok: true }), 3000)
      return
    }

    try {
      setLoading(true)
      await API.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      })
      setMsg({ text: 'Password changed successfully!', ok: true })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })

      // Force logout after password change for security
      setTimeout(() => {
        clearAuthSession()
        navigate('/login')
      }, 3000)
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Unable to change password', ok: false })
      setTimeout(() => setMsg({ text: '', ok: true }), 3000)
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <>
        <Navbar user={user} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered} />
        <div
          className="min-h-screen bg-slate-50 transition-[padding-left] duration-[260ms]"
          style={{ paddingLeft: isSidebarOpen || isSidebarHovered ? 272 : 68 }}
        >
          <Sidebar
            user={user}
            activeView="settings"
            stats={{ total: 0, progress: 0, myTasks: 0, assignedByMe: 0 }}
            teamMembers={[]}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered}
          />
          <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-60px)]">
            <p className="text-slate-500 font-semibold tracking-widest uppercase animate-pulse">Loading Settings...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar user={user} notificationCount={notifications.length} onNotificationClick={() => navigate('/notifications')} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered} />
      <div
        className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_40%,#e2e8f0_100%)] transition-[padding-left] duration-[260ms]"
        style={{ paddingLeft: isSidebarOpen || isSidebarHovered ? 272 : 68 }}
      >
        <Sidebar
          user={user}
          activeView="settings"
          stats={stats}
          teamMembers={teamMembers}
          notificationCount={notifications.length}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered}
        />
        <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_24px_55px_rgba(15,23,42,0.06)] border border-slate-200">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Settings
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Security & Password</h1>
              <p className="mt-2 text-sm text-slate-500">
                Update your account password to maintain security.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
              {msg.text && (
                <div className={`p-4 rounded-2xl text-sm font-semibold border ${msg.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                  {msg.text}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Current Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_8px_16px_rgba(37,99,235,0.2)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.3)]"
                >
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
