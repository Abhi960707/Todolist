import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api'
import Todo from './Todo'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Subtask from './Subtask'
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  saveAuthSession,
} from '../utils/auth'
import {
  MdAssignmentInd,
  MdCheckCircle,
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdNotificationsActive,
  MdOutlinePendingActions,
} from 'react-icons/md'

const COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777']

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

const formatDate = (dateValue) => {
  if (!dateValue) return 'No due date'

  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getViewTitle = (activeView) => {
  if (activeView === 'my-tasks') return 'My tasks'
  if (activeView === 'assigned-by-me') return 'Assigned by me'
  if (activeView === 'assigned-to-me') return 'Assigned to me'
  if (activeView === 'notifications') return 'Notifications'
  if (activeView === 'team') return 'Team'
  if (activeView === 'profile') return 'My Profile'
  return 'Overview'
}

const getViewDescription = (activeView) => {
  if (activeView === 'my-tasks') return 'Track tasks that belong to you, including tasks you assigned out.'
  if (activeView === 'assigned-by-me') return 'Review delegated work and monitor completion progress.'
  if (activeView === 'assigned-to-me') return 'See the tasks your team assigned to you and close them confidently.'
  if (activeView === 'notifications') return 'Unread completion alerts from tasks assigned to other users.'
  if (activeView === 'team') return 'Manage your workspace members and create new users.'
  if (activeView === 'profile') return 'Manage your account details.'
  return 'A professional dashboard for task health, workload, and team delivery.'
}

const TaskCard = ({ todo, currentUserId, onCardClick }) => {
  const isAssignee = todo.assignedTo?._id === currentUserId || todo.assignedTo?.id === currentUserId;

  let statusText = 'Pending';
  let statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
  if (todo.completed) {
    statusText = 'Completed';
    statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  let roleText = 'Personal';
  if (todo.assignedTo) {
    roleText = isAssignee ? 'Assigned to You' : `To: ${todo.assignedTo.name.split(' ')[0]}`;
  }

  return (
    <article
      onClick={() => onCardClick(todo._id)}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-px"
    >
      <h3 className="font-semibold text-slate-800 truncate pr-8">{todo.title}</h3>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={`px-2.5 py-1 rounded-full font-bold ${statusColor} border`}>
          {statusText}
        </span>
        <span className="text-slate-500 font-medium">{roleText}</span>
      </div>
    </article>
  )
}

const NotificationCard = ({ item, markNotificationRead, onCardClick }) => (
  <div
    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)] cursor-pointer transition hover:-translate-y-1 hover:shadow-md"
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
          {item.assignedTo?.name || 'A team member'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Completed on {formatDate(item.completedAt)}.
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); markNotificationRead(item._id) }}
        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 shrink-0"
      >
        Mark as read
      </button>
    </div>
  </div>
)

const Todolist = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [reminder, setReminder] = useState(false)
  const [assignedTo, setAssignedTo] = useState('')
  const [assignmentNote, setAssignmentNote] = useState('')
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [todos, setTodos] = useState([])
  const [notifications, setNotifications] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [user, setUser] = useState(getStoredUser())
  const location = useLocation()
  const [activeView, setActiveView] = useState(location.state?.targetView || 'overview')

  useEffect(() => {
    if (location.state?.targetView) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveView(location.state.targetView)
      // Clean up state so refresh doesn't hold it
      window.history.replaceState({}, document.title)
    }
  }, [location.state])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('') // New state for success message
  const [errorMessage, setErrorMessage] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const shownNotificationsRef = useRef(new Set())
  const [userToDelete, setUserToDelete] = useState(null)   // { id, name } or null

  const [cuForm, setCuForm] = useState({ name: '', email: '', password: '', secretKeyword: '' })
  const [cuLoading, setCuLoading] = useState(false)
  const [cuMsg, setCuMsg] = useState({ text: '', ok: true })

  const currentUserId = user?.id || user?._id || ''

  const applyNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const fetchDashboardData = async (token) => {
    const sessionToken = token || getStoredToken()
    if (!sessionToken) return

    const [profileRes, todosRes, usersRes, notificationsRes] = await Promise.all([
      API.get('/auth/me'),
      API.get('/todo'),
      API.get('/auth/users'),
      API.get('/todo/notifications'),
    ])

    const profileUser = profileRes.data.user
    setUser(profileUser)
    saveAuthSession({ token: sessionToken, user: profileUser })
    setTodos(todosRes.data)
    setNotifications(notificationsRes.data)
    setTeamMembers(usersRes.data.users)
  }

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      navigate('/login')
      return
    }

    applyNotificationPermission()

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData(token)
      .catch((error) => {
        if (error.response?.status === 401) {
          clearAuthSession()
          navigate('/login')
          return
        }

        console.error('Dashboard load error:', error)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  useEffect(() => {
    if (!notifications.length || Notification.permission !== 'granted') {
      return
    }

    notifications.forEach((item) => {
      if (shownNotificationsRef.current.has(item._id)) {
        return
      }

      shownNotificationsRef.current.add(item._id)
      new Notification('Assigned task completed', {
        body: `${item.assignedTo?.name || 'A user'} finished "${item.title}"`,
        icon: '/favicon.svg',
      })
    })
  }, [notifications])

  const refreshTodosAndNotifications = async () => {
    const [todosRes, notificationsRes] = await Promise.all([
      API.get('/todo'),
      API.get('/todo/notifications'),
    ])

    setTodos(todosRes.data)
    setNotifications(notificationsRes.data)
  }

  const refreshTeamMembers = async () => {
    try {
      const usersRes = await API.get('/auth/users')
      setTeamMembers(usersRes.data.users)
    } catch (err) {
      console.error('Failed to refresh team members:', err)
    }
  }

  const resetCreateForm = () => {
    setTitle('')
    setDueDate('')
    setReminder(false)
    setAssignedTo('')
    setAssignmentNote('')
    setAttachmentFile(null)
  }

  const addTodo = async () => {
    if (!title.trim() || !dueDate) {
      setErrorMessage('Task title and due date are required.')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    if (assignedTo && !assignmentNote.trim()) {
      setErrorMessage('An assignment note is required when delegating a task.')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')

      // Use FormData to support optional file upload
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('dueDate', dueDate || '')
      formData.append('reminder', reminder ? 'true' : 'false')
      formData.append('assignedTo', assignedTo || '')
      formData.append('assignmentNote', assignmentNote.trim())
      if (attachmentFile) {
        formData.append('attachment', attachmentFile)
      }

      const res = await API.post('/todo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setTodos((prev) => [res.data, ...prev])
      setSuccessMessage('Task Assign Successfully !')
      setTimeout(() => setSuccessMessage(''), 3000)
      resetCreateForm()
      await refreshTodosAndNotifications()
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to create task')
      setTimeout(() => setErrorMessage(''), 3000)
      setSuccessMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const markNotificationRead = async (id) => {
    try {
      await API.patch(`/todo/${id}/notifications/read`)
      setNotifications((prev) => prev.filter((item) => item._id !== id))
      shownNotificationsRef.current.delete(id)
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update notification')
    }
  }

  const handleCreateUser = async (e) => {
    e?.preventDefault()
    const { name, email, password, secretKeyword } = cuForm
    if (!name.trim() || !email.trim() || !password.trim() || !secretKeyword.trim()) {
      setCuMsg({ text: 'All fields are required', ok: false })
      setTimeout(() => setCuMsg({ text: '', ok: true }), 3000)
      return
    }
    if (password.trim().length < 4) {
      setCuMsg({ text: 'Password must be at least 4 characters', ok: false })
      setTimeout(() => setCuMsg({ text: '', ok: true }), 3000)
      return
    }
    try {
      setCuLoading(true)
      setCuMsg({ text: '', ok: true })
      const res = await API.post('/auth/create-user', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        secretKeyword: secretKeyword.trim(),
      })
      setCuMsg({ text: res.data?.message || 'User created successfully!', ok: true })
      setTimeout(() => setCuMsg({ text: '', ok: true }), 3000)
      setCuForm({ name: '', email: '', password: '', secretKeyword: '' })
      await refreshTeamMembers()
    } catch (err) {
      setCuMsg({ text: err.response?.data?.message || 'Unable to create user', ok: false })
      setTimeout(() => setCuMsg({ text: '', ok: true }), 3000)
    } finally {
      setCuLoading(false)
    }
  }

  const deleteUser = async (userIdToDelete) => {
    try {
      await API.delete(`/auth/user/${userIdToDelete}`);
      setTeamMembers((prev) => prev.filter((member) => (member._id || member.id) !== userIdToDelete));
      await refreshTeamMembers(); // Refresh team members after deletion
      await refreshTodosAndNotifications();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to delete user');
    } finally {
      setUserToDelete(null);
    }
  };

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
  const assignedToMe = todos.filter(
    (todo) => todo.assignedTo?._id === currentUserId || todo.assignedTo?.id === currentUserId,
  )
  const pending = todos.filter((todo) => !todo.completed)
  const completed = todos.filter((todo) => todo.completed)
  const progress = todos.length ? Math.round((completed.length / todos.length) * 100) : 0

  let currentTasks = []
  if (activeView === 'my-tasks') currentTasks = myTasks
  if (activeView === 'assigned-by-me') currentTasks = assignedByMe
  if (activeView === 'assigned-to-me') currentTasks = assignedToMe

  const stats = {
    total: todos.length,
    pending: pending.length,
    completed: completed.length,
    progress,
    myTasks: myTasks.length,
    assignedByMe: assignedByMe.length,
    assignedToMe: assignedToMe.length,
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_45%,#e2e8f0_100%)] px-4">
        <div className="rounded-[28px] border border-white/70 bg-white/90 px-8 py-6 text-center shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Loading</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Preparing your dashboard</h2>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar
        notificationCount={notifications.length}
        onNotificationClick={() => navigate('/notifications')}
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div
        className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_40%,#e2e8f0_100%)] transition-[padding-left] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ paddingLeft: isSidebarOpen || isSidebarHovered ? 272 : 68 }}
      >
        <Sidebar
          activeView={activeView}
          isSidebarOpen={isSidebarOpen}
          setActiveView={setActiveView}
          stats={stats}
          user={user}
          teamMembers={teamMembers}
          notificationCount={notifications.length}
          setIsSidebarOpen={setIsSidebarOpen}
          setIsSidebarHovered={setIsSidebarHovered}
        />
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <main className="min-w-0 space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_55px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
                    {getViewTitle(activeView)}
                  </p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
                    {activeView === 'overview' ? `Welcome back, ${user?.name || 'User'}` : getViewTitle(activeView)}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                    {getViewDescription(activeView)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Total</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Pending</p>
                    <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pending}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Completed</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.completed}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Progress</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.progress}%</p>
                  </div>
                </div>
              </div>
            </section>



            {activeView === 'overview' && (
              <>
                <section className="grid gap-4 xl:grid-cols-4">
                  <div
                    onClick={() => setActiveView('assigned-by-me')}
                    className="cursor-pointer rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <MdAssignmentInd size={24} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Assigned by me</p>
                        <p className="text-xs text-slate-500">Delegated tasks</p>
                      </div>
                    </div>
                    <p className="mt-5 text-4xl font-semibold text-slate-900">{assignedByMe.length}</p>
                  </div>

                  <div
                    onClick={() => setActiveView('assigned-to-me')}
                    className="cursor-pointer rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <MdOutlinePendingActions size={24} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Assigned to me</p>
                        <p className="text-xs text-slate-500">Incoming work</p>
                      </div>
                    </div>
                    <p className="mt-5 text-4xl font-semibold text-slate-900">{assignedToMe.length}</p>
                  </div>

                  <div
                    onClick={() => setActiveView('my-tasks')}
                    className="cursor-pointer rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-emerald-600">
                        <MdCheckCircle size={24} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Closed work</p>
                        <p className="text-xs text-slate-500">Finished tasks</p>
                      </div>
                    </div>
                    <p className="mt-5 text-4xl font-semibold text-slate-900">{completed.length}</p>
                  </div>

                  <div
                    onClick={() => setActiveView('notifications')}
                    className="cursor-pointer rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-amber-600">
                        <MdNotificationsActive size={24} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Unread alerts</p>
                        <p className="text-xs text-slate-500">Completion notifications</p>
                      </div>
                    </div>
                    <p className="mt-5 text-4xl font-semibold text-slate-900">{notifications.length}</p>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                  <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_55px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                          Recent Tasks
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Latest activity</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('my-tasks')}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Open task list
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {todos.slice(0, 4).map((todo) => {
                        const isOwnerRow = todo.user?._id === currentUserId || todo.user?.id === currentUserId
                        const isCompletedByAssigneeRow = todo.completed && todo.assignedTo && isOwnerRow
                        return isCompletedByAssigneeRow ? (
                          <div
                            key={todo._id}
                            onClick={() => navigate(`/notification/${todo._id}`)}
                            className="cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 transition hover:bg-emerald-100"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    <MdCheckCircle size={11} /> Completed
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-800">{todo.title}</p>
                                <p className="mt-0.5 text-xs text-slate-600">
                                  <span className="font-semibold">{todo.assignedTo.name}</span> completed this · Tap to review
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-emerald-600">→</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={todo._id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{todo.title}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {todo.assignedTo ? `Assigned to ${todo.assignedTo.name}` : 'Personal task'}
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-slate-500">{formatDate(todo.dueDate)}</span>
                            </div>
                          </div>
                        )
                      })}
                      {!todos.length && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                          Your task timeline will appear here once you create work.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_55px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                          Notifications
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Completion feed</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('notifications')}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View all
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {notifications.slice(0, 3).map((item) => (
                        <div
                          key={item._id}
                          onClick={() => navigate(`/notification/${item._id}`)}
                          className="cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 transition hover:bg-emerald-100"
                        >
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            <span className="font-semibold">{item.assignedTo?.name || 'A team member'}</span> completed it on {formatDate(item.completedAt)} · <span className="text-emerald-700 font-medium">Tap to review →</span>
                          </p>
                        </div>
                      ))}
                      {!notifications.length && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                          No new completion notifications right now.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeView === 'notifications' && (
              <section className="space-y-4">
                {notifications.length ? (
                  notifications.map((item) => (
                    <NotificationCard
                      key={item._id}
                      item={item}
                      markNotificationRead={markNotificationRead}
                      onCardClick={(id) => navigate(`/notification/${id}`)}
                    />
                  ))
                ) : (
                  <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <p className="text-lg font-semibold text-slate-800">All caught up</p>
                    <p className="mt-2 text-sm text-slate-500">
                      New completion alerts will appear here when assigned work is finished.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Delete User Modal */}
            {userToDelete && (
              <div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                onClick={() => setUserToDelete(null)}
              >
                <div
                  className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_32px_80px_rgba(15,23,42,0.22)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mx-auto">
                    <MdDelete size={28} className="text-red-500" />
                  </div>
                  <h3 className="mt-5 text-center text-lg font-semibold text-slate-900">
                    Delete User
                  </h3>
                  <p className="mt-2 text-center text-sm text-slate-500">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-slate-800">{userToDelete.name}</span>?
                    This action cannot be undone.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setUserToDelete(null)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUser(userToDelete.id)}
                      className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Team view — shows Workspace Members + Create User form */}
            {activeView === 'team' && (
              <section className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex-1 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_55px_rgba(15,23,42,0.06)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Team Directory
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">Workspace Members</h2>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {teamMembers.map((m, i) => {
                      const mId = m._id || m.id;
                      const isCreator = currentUserId === (m.createdBy?._id || m.createdBy?.id || m.createdBy);
                      return (
                        <div
                          key={mId}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:bg-white sm:flex-row sm:items-center"
                        >
                          <div className="flex flex-1 items-center gap-4">
                            <div
                              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                              style={{ background: COLORS[i % COLORS.length] }}
                            >
                              {initials(m.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
                              <p className="truncate text-xs text-slate-500">{m.email}</p>
                            </div>
                          </div>
                          {isCreator && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete({ id: mId, name: m.name })}
                              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300"
                            >
                              <MdDelete size={14} />
                              Delete User
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {!teamMembers.length && (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                        No team members yet. Create a user using the form on the right.
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full shrink-0 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_55px_rgba(15,23,42,0.06)] lg:w-[400px]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Administration
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create User</h2>
                  </div>

                  {cuMsg.text && (
                    <div
                      className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        cuMsg.ok
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-600'
                      }`}
                    >
                      {cuMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleCreateUser} className="mt-6 space-y-4" autoComplete="off">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                      <input type="text" value={cuForm.name} onChange={(e) => setCuForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white" placeholder="Enter full name" autoComplete="off" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                      <input type="email" value={cuForm.email} onChange={(e) => setCuForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white" placeholder="Enter email address" autoComplete="off" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                      <input type="password" value={cuForm.password} onChange={(e) => setCuForm((p) => ({ ...p, password: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white" placeholder="Create a password (min 4 chars)" autoComplete="new-password" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Security Keyword</label>
                      <input type="text" value={cuForm.secretKeyword} onChange={(e) => setCuForm((p) => ({ ...p, secretKeyword: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white" placeholder="Secret name for recovery" autoComplete="off" />
                    </div>
                    <button type="submit" disabled={cuLoading} className="mt-2 w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
                      {cuLoading ? 'Creating user...' : 'Create user'}
                    </button>
                  </form>
                </div>
              </section>
            )}

            {/* Profile View */}
            {activeView === 'profile' && (
              <section className="max-w-3xl">
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_55px_rgba(15,23,42,0.06)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Profile Details
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">Your Information</h2>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900">
                        {user?.name || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900">
                        {user?.email || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Assign Task view — shows Create Task form + delegated task cards */}
            {activeView === 'assigned-by-me' && (
              <>
                <Todo
                  title={title}
                  setTitle={setTitle}
                  dueDate={dueDate}
                  setDueDate={setDueDate}
                  reminder={reminder}
                  setReminder={setReminder}
                  assignedTo={assignedTo}
                  setAssignedTo={setAssignedTo}
                  assignmentNote={assignmentNote}
                  setAssignmentNote={setAssignmentNote}
                  attachmentFile={attachmentFile}
                  setAttachmentFile={setAttachmentFile}
                  teamMembers={teamMembers}
                  addTodo={addTodo}
                  isSubmitting={isSubmitting}
                />
                
                {errorMessage && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <section className="mt-4 space-y-4">
                  {currentTasks.length ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {currentTasks.map((todo) => (
                        <TaskCard
                          key={todo._id}
                          todo={todo}
                          currentUserId={currentUserId}
                          onCardClick={(id) => navigate(`/task/${id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                      <p className="text-lg font-semibold text-slate-800">No delegated tasks yet</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Use the form above to create and assign a task to a team member.
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* My Tasks / Assigned-to-me views */}
            {(activeView === 'my-tasks' || activeView === 'assigned-to-me') && (
              <section className="space-y-4">
                {currentTasks.length ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {currentTasks.map((todo) => (
                      <TaskCard
                          key={todo._id}
                          todo={todo}
                          currentUserId={currentUserId}
                          onCardClick={(id) => navigate(`/task/${id}`)}
                        />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <p className="text-lg font-semibold text-slate-800">No tasks in this view</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Tasks will appear here once they are created or assigned.
                    </p>
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
      </div>
    </>
  )
}

export default Todolist
