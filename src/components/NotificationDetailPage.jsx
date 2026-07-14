import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../api'
import {
  MdArrowBack,
  MdAttachFile,
  MdCalendarToday,
  MdCheckCircle,
  MdPerson,
  MdSchedule,
  MdOpenInNew,
  MdDone,
  MdHourglassEmpty,
  MdNotificationsActive,
} from 'react-icons/md'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { getStoredUser } from '../utils/auth'

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'N/A'

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const NotificationDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = getStoredUser()
  const currentUserId = currentUser?.id || currentUser?._id

  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState(null) // 'done' | 'pending'

  // State for layout
  const [isSidebarOpen, setIsSidebarOpen] = useState()
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [todos, setTodos] = useState([])
  const [notifications, setNotifications] = useState([])
  const [teamMembers, setTeamMembers] = useState([])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    Promise.all([
      API.get(`/todo/${id}`),
      API.get('/auth/users'),
      API.get('/todo'),
      API.get('/todo/notifications'),
    ])
      .then(([taskRes, usersRes, todosRes, notificationsRes]) => {
        setTask(taskRes.data)
        setTeamMembers(usersRes.data.users)
        setTodos(todosRes.data)
        setNotifications(notificationsRes.data)
      })
      .catch(() => setError('Notification not found or you do not have access.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleMarkDone = async () => {
    try {
      setActionLoading(true)
      // Mark completionNotifiedAt to remove from unread list + keep completed
      await API.patch(`/todo/${id}/notifications/read`)
      setOutcome('done')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark done.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkPending = async () => {
    try {
      setActionLoading(true)
      // Reset task back to pending
      await API.patch(`/todo/${id}`, {
        completed: false,
      })
      setOutcome('pending')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark pending.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setActionLoading(false)
    }
  }

  // Stats for Sidebar
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_45%,#e2e8f0_100%)]">
        <div className="rounded-[28px] border border-white/70 bg-white/90 px-8 py-6 text-center shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Loading</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Fetching notification…</h2>
        </div>
      </div>
    )
  }

  if (error && !task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_45%,#e2e8f0_100%)] px-4">
        <div className="max-w-md rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const attachmentUrl = task?.attachmentUrl ? `${BACKEND}${task.attachmentUrl}` : null

  return (
    <>
      <Navbar
        user={currentUser}
        notificationCount={notifications.length}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered}
      />
      <div
        className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_40%,#e2e8f0_100%)] transition-[padding-left] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ paddingLeft: isSidebarOpen || isSidebarHovered ? 272 : 68 }}
      >
        <Sidebar
          activeView={null}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered}
          stats={stats}
          user={currentUser}
          teamMembers={teamMembers}
          notificationCount={notifications.length}
        />
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <MdArrowBack size={18} />
          Back
        </button>

        {/* Outcome banner */}
        {outcome === 'done' && (
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <MdCheckCircle size={24} className="text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800">Moved to Closed Work</p>
                <p className="mt-0.5 text-sm text-emerald-600">
                  This task has been marked as done and archived.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/todolist')}
              className="mt-4 rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {outcome === 'pending' && (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <MdHourglassEmpty size={24} className="text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">Task marked as Pending</p>
                <p className="mt-0.5 text-sm text-amber-600">
                  The task has been reset and will reappear in the assignee's task list.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/todolist')}
              className="mt-4 rounded-2xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Header */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <MdNotificationsActive size={14} />
              Task Completed
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
            {task?.title}
          </h1>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <MdPerson size={18} className="text-slate-400" />
            <span>
              Completed by{' '}
              <span className="font-semibold text-slate-800">
                {task?.assignedTo?.name || 'Team member'}
              </span>
            </span>
          </div>
        </div>

        {/* Meta details */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Task Details
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500">
                <MdPerson size={16} className="text-slate-400" />
                Completed by
              </span>
              <span className="font-semibold text-slate-800">
                {task?.assignedTo?.name || 'Team member'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500">
                <MdCalendarToday size={16} className="text-slate-400" />
                Due date
              </span>
              <span className="font-semibold text-slate-800">{formatDate(task?.dueDate)}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
              <span className="flex items-center gap-2 text-emerald-600">
                <MdCheckCircle size={16} />
                Completed on
              </span>
              <span className="font-semibold text-emerald-700">
                {formatDateTime(task?.completedAt || task?.updatedAt)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500">
                <MdSchedule size={16} className="text-slate-400" />
                Created
              </span>
              <span className="font-semibold text-slate-800">{formatDateTime(task?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Attachment */}
        {attachmentUrl && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Attached File
            </p>
            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                <MdAttachFile size={24} className="text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-indigo-800">
                  {task?.attachmentName || 'Attachment'}
                </p>
                <p className="mt-0.5 text-xs text-indigo-500">Click to open / download</p>
              </div>
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                <MdOpenInNew size={14} />
                Open
              </a>
            </div>
          </div>
        )}

        {/* Completion note from assignee */}
        {task?.note && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Note from {task?.assignedTo?.name || 'Assignee'}
            </p>
            <blockquote className="mt-4 rounded-2xl border-l-2 border-slate-300 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 italic">
              "{task.note}"
            </blockquote>
          </div>
        )}

        {/* Action buttons */}
        {!outcome && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Action
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Choose how to handle this completed task. Marking Done will archive it in Closed Work.
            </p>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleMarkDone}
                disabled={actionLoading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <MdDone size={18} />
                {actionLoading ? 'Processing…' : 'Mark Done'}
              </button>
              <button
                type="button"
                onClick={handleMarkPending}
                disabled={actionLoading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 py-3.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <MdHourglassEmpty size={18} />
                {actionLoading ? 'Processing…' : 'Mark Pending'}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  )
}

export default NotificationDetailPage
