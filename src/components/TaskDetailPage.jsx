import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../api'
import Subtask from './Subtask'
import {
  MdArrowBack,
  MdCancel,
  MdAttachFile,
  MdCalendarToday,
  MdCheckCircle,
  MdDelete,
  MdEdit,
  MdPerson,
  MdSchedule,
  MdNotifications,
  MdSend,
  MdOpenInNew,
  MdSave,
  MdUndo,
} from 'react-icons/md'
import { getStoredUser } from '../utils/auth'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'No due date'

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

const TaskDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = getStoredUser()
  const currentUserId = currentUser?.id || currentUser?._id

  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [error, setError] = useState('')

  // State for layout
  const today = new Date().toISOString().split('T')[0]
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [todos, setTodos] = useState([])
  const [notifications, setNotifications] = useState([])

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
        setNote(taskRes.data.note || '')
        setTeamMembers(usersRes.data.users)
        setTodos(todosRes.data)
        setNotifications(notificationsRes.data)
      })
      .catch(() => setError('Task not found or you do not have access.'))
      .finally(() => setLoading(false))
  }, [id])

  // This is a derived state, no need for useState
  const submitted = task?.completed || false

  const isOwner =
    task?.user?._id === currentUserId || task?.user?.id === currentUserId
  const isAssignee =
    task?.assignedTo?._id === currentUserId || task?.assignedTo?.id === currentUserId

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({
        title: task.title,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        reminder: task.reminder,
        assignedTo: task.assignedTo?._id || task.assignedTo?.id || '',
        assignmentNote: task.assignmentNote || '',
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSave = async () => {
    if (!editData.title.trim()) {
      setError('Task title cannot be empty.')
      setTimeout(() => setError(''), 3000)
      return
    }
    try {
      setSubmitting(true)
      const res = await API.put(`/todo/${id}`, {
        ...editData,
        assignedTo: editData.assignedTo || null,
      })
      setTask(res.data)
      setIsEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        await API.delete(`/todo/${id}`)
        navigate('/todolist', { state: { targetView: 'my-tasks' } })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete task.')
        setTimeout(() => setError(''), 3000)
      }
    }
  }

  const handleToggleComplete = async () => {
    // This is for the OWNER to mark a task as complete or pending.
    const isCompleting = !task.completed

    try {
      setSubmitting(true)
      const payload = {
        completed: isCompleting,
        note: isCompleting ? task.note : null,
        completedAt: isCompleting ? new Date().toISOString() : null,
      }
      const res = await API.patch(`/todo/${id}`, payload)
      setTask(res.data)
      if (!isCompleting) {
        setNote('')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssigneeSubmit = async () => {
    if (!note.trim()) {
      setError('Please write a completion note before submitting.')
      setTimeout(() => setError(''), 3000)
      return
    }
    try {
      setSubmitting(true)
      await API.patch(`/todo/${id}`, {
        note: note.trim(),
        completed: true,
        completedAt: new Date().toISOString(),
      })
      setTask((prev) => ({
        ...prev,
        completed: true,
        completedAt: new Date().toISOString(),
        note: note.trim(),
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSubmitting(false)
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
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Fetching task details…</h2>
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
        onNotificationClick={() => navigate('/notifications')}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div
        className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_40%,#e2e8f0_100%)] transition-[padding-left] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ paddingLeft: isSidebarOpen ? 272 : 68 }}
      >
        <Sidebar
          activeView={null}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          stats={stats}
          user={currentUser}
          teamMembers={teamMembers}
          notificationCount={notifications.length}
        />
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Back button */}
          <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <MdArrowBack size={18} />
            Back to Dashboard
          </button>

          {/* --- OWNER ACTIONS --- */}
          {isOwner && !isEditing && (
            <div className="flex items-center gap-2">
              {task?.completed ? (
                <button onClick={handleToggleComplete} disabled={submitting} className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60">
                  <MdUndo size={16} /> {submitting ? 'Saving...' : 'Mark as Pending'}
                </button>
              ) : (
                <button onClick={handleToggleComplete} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60">
                  <MdCheckCircle size={16} /> {submitting ? 'Saving...' : 'Mark as Complete'}
                </button>
              )}
              <button onClick={handleEditToggle} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <MdEdit size={16} /> Edit
              </button>
              <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
                <MdDelete size={16} /> Delete
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Header card */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                task?.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {task?.completed ? 'Completed' : 'In Progress'}
            </span>
            {task?.assignedTo && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Assigned Task
              </span>
            )}
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
            {task?.title}
          </h1>

          {/* Assigned by */}
          {isEditing ? (
            <div className="mt-6 space-y-4">
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-2xl font-semibold outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <textarea
                value={editData.assignmentNote}
                placeholder="Update instructions..."
                onChange={(e) => setEditData({ ...editData, assignmentNote: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={editData.dueDate}
                min={today}
                  onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
                <select
                  value={editData.assignedTo}
                  onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="">Assign to myself</option>
                  {teamMembers.map((member) => (
                    <option key={member.id || member._id} value={member.id || member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-700">Reminder</span>
                <button
                  type="button"
                  onClick={() => setEditData({ ...editData, reminder: !editData.reminder })}
                  className={`relative h-7 w-12 rounded-full transition ${editData.reminder ? 'bg-slate-900' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${editData.reminder ? 'left-6' : 'left-1'
                      }`}
                  />
                </button>
              </label>
              <div className="flex gap-3 border-t border-slate-200 pt-5">
                <button onClick={handleSave} disabled={submitting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  <MdSave size={16} /> {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleEditToggle} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <MdCancel size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <MdPerson size={18} className="text-slate-400" />
            <span>
              Assigned by{' '}
              <span className="font-semibold text-slate-800">{task?.user?.name || 'Unknown'}</span>
            </span>
          </div>
        )}

        </div>
        
        {!isEditing && <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Task Details
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500">
                <MdCalendarToday size={16} className="text-slate-400" />
                Due date
              </span>
              <span className="font-semibold text-slate-800">{formatDate(task?.dueDate)}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500">
                <MdPerson size={16} className="text-slate-400" />
                Assigned by
              </span>
              <span className="font-semibold text-slate-800">{task?.user?.name || 'Unknown'}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500">
                <MdNotifications size={16} className="text-slate-400" />
                Reminder
              </span>
              <span className="font-semibold text-slate-800">
                {task?.reminder ? 'Enabled' : 'Off'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500">
                <MdSchedule size={16} className="text-slate-400" />
                Created
              </span>
              <span className="font-semibold text-slate-800">{formatDateTime(task?.createdAt)}</span>
            </div>

            {task?.completed && (
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                <span className="flex items-center gap-2 text-emerald-600">
                  <MdCheckCircle size={16} />
                  Completed
                </span>
                <span className="font-semibold text-emerald-700">
                  {formatDateTime(task?.completedAt || task?.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>}

        {task?.assignmentNote && !isEditing && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Task Instructions
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
              {task.assignmentNote}
            </p>
          </div>
        )}

        {attachmentUrl && !isEditing && (
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

        {isAssignee && !isEditing && !submitted && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Note for Task Creator
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Write a handoff note for <span className="font-semibold text-slate-700">{task?.user?.name}</span>. This will be sent when you submit.
            </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe what you did, any handoff details, or next steps…"
                  rows={5}
                  className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAssigneeSubmit}
                  disabled={submitting}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <MdSend size={16} />
                  {submitting ? 'Submitting…' : 'Complete Task & Submit Note'}
                </button>
          </div>
        )}

        {/* Completion Note Display */}
        {task?.completed && task?.note && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              {task.assignedTo && isOwner
                ? `Completion Note from ${task.assignedTo.name}`
                : 'Completion Note'}
            </p>
            <blockquote className="mt-4 whitespace-pre-wrap border-l-4 border-slate-300 pl-4 text-sm italic text-slate-600">
              {task.note}
            </blockquote>
          </div>
        )}
        {/* Subtask Kanban — visible to both owner and assignee */}
        {task && !isEditing && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_rgba(15,23,42,0.07)]">
            <Subtask
              todoId={task._id}
              currentUserId={currentUserId}
              isOwner={isOwner}
              teamMembers={teamMembers}
            />
          </div>
        )}
      </div>
      </div>
    </>
  )
}

export default TaskDetailPage
