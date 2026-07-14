import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { getStoredUser } from '../utils/auth'
import { MdNotificationsActive } from 'react-icons/md'

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A'
  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const Notifications = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [todos, setTodos] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(getStoredUser())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [userRes, notificationsRes, todosRes, teamRes] = await Promise.all([
          API.get('/auth/me'),
          API.get('/todo/notifications'),
          API.get('/todo'),
          API.get('/auth/users'),
        ])
        setUser(userRes.data.user)
        setNotifications(notificationsRes.data)
        setTodos(todosRes.data)
        setTeamMembers(teamRes.data.users)
      } catch (err) {
        console.error('Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !user) {
    return (
      <>
        <Navbar user={user} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered} />
        <div 
          className="min-h-screen bg-slate-50 transition-[padding-left] duration-[260ms]"
          style={{ paddingLeft: isSidebarOpen || isSidebarHovered ? 272 : 68 }}
        >
          <Sidebar 
            activeView="notifications" 
            user={user} 
            stats={{}}
            teamMembers={[]}
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered} 
          />
          <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-60px)]">
            <p className="text-slate-500 font-semibold tracking-widest uppercase">Loading Notifications...</p>
          </div>
        </div>
      </>
    )
  }

  const currentUserId = user.id || user._id
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

  const markNotificationRead = async (id) => {
    try {
      await API.patch(`/todo/${id}/notifications/read`)
      setNotifications((prev) => prev.filter((item) => item._id !== id))
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update notification')
    }
  }

  return (
    <>
      <Navbar user={user} notificationCount={notifications.length} onNotificationClick={() => {}} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered} /> 
      <div 
        className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_40%,#e2e8f0_100%)] transition-[padding-left] duration-[260ms]"
        style={{ paddingLeft: isSidebarOpen || isSidebarHovered ? 272 : 68 }}
      >
        <Sidebar 
          activeView="notifications" 
          user={user} 
          stats={stats} 
          teamMembers={teamMembers}
          notificationCount={notifications.length}
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered} 
        />
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Notifications</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Completion Alerts</h1>
            <p className="mt-2 text-slate-500 text-sm">Review tasks that have been completed by your team.</p>
          </header>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-semibold text-slate-800">All caught up</p>
                <p className="mt-2 text-sm text-slate-500">
                  New completion alerts will appear here when assigned work is finished.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <NotificationCard
                  key={item._id}
                  item={item}
                  markNotificationRead={markNotificationRead}
                  onCardClick={(id) => navigate(`/notification/${id}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

const NotificationCard = ({ item, markNotificationRead, onCardClick }) => (
  <div
    className="cursor-pointer rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-md"
    onClick={() => onCardClick(item._id)}
  >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <MdNotificationsActive size={16} />
          Task completed
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-600">
          By {item.assignedTo?.name || 'A team member'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Completed on {formatDate(item.completedAt)}. Click to review.
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          markNotificationRead(item._id)
        }}
        className="shrink-0 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Mark as read
      </button>
    </div>
  </div>
)

export default Notifications
