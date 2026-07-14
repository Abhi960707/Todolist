import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { MdAdd, MdClose, MdDelete, MdDragIndicator, MdPerson } from 'react-icons/md'
import API from '../api'

/* ── Constants ─────────────────────────────────────────────────── */
const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400'   },
  { id: 'in-progress', label: 'In Progress',  color: 'bg-amber-50  text-amber-700',   dot: 'bg-amber-400'   },
  { id: 'in-review',   label: 'In Review',    color: 'bg-violet-50 text-violet-700',  dot: 'bg-violet-400'  },
  { id: 'done',        label: 'Done',         color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
]

const COLUMN_BORDER = {
  'todo':        'border-slate-200',
  'in-progress': 'border-amber-200',
  'in-review':   'border-violet-200',
  'done':        'border-emerald-200',
}

/* ── Helpers ───────────────────────────────────────────────────── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

const AVATAR_COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#7c3aed','#db2777']
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

/* ── SubtaskCard ────────────────────────────────────────────────── */
const SubtaskCard = ({ subtask, index, isOwner, onDelete, onStatusChange }) => (
  <Draggable draggableId={subtask._id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className={`group relative flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition
          ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-300 rotate-[0.8deg]' : 'hover:shadow-md'}`}
      >
        {/* Drag handle */}
        <span
          {...provided.dragHandleProps}
          className="mt-0.5 shrink-0 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          title="Drag to move"
        >
          <MdDragIndicator size={16} />
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-5 text-slate-800 break-words">{subtask.title}</p>
          {subtask.assignedTo && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: avatarColor(subtask.assignedTo.name) }}
              >
                {initials(subtask.assignedTo.name)}
              </span>
              <span className="text-[11px] text-slate-500">{subtask.assignedTo.name}</span>
            </div>
          )}

          {/* Tap Buttons for Status */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (subtask.status !== col.id) {
                    onStatusChange(subtask._id, col.id)
                  }
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                  subtask.status === col.id
                    ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Delete (owner only) */}
        {isOwner && (
          <button
            type="button"
            onClick={() => onDelete(subtask._id)}
            className="mt-0.5 shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            title="Delete subtask"
          >
            <MdDelete size={14} />
          </button>
        )}
      </div>
    )}
  </Draggable>
);

/* ── AddSubtaskForm ─────────────────────────────────────────────── */
const AddSubtaskForm = ({ teamMembers, onAdd, onCancel, loading }) => {
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (title.trim()) onAdd({ title: title.trim(), assignedTo: assignedTo || null })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-2xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Subtask title…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
      {teamMembers?.length > 0 && (
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">No assignee</option>
          {teamMembers.map((m) => (
            <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding…' : 'Add subtask'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/* ── ProgressBar ────────────────────────────────────────────────── */
const ProgressBar = ({ subtasks }) => {
  if (!subtasks.length) return null
  const done = subtasks.filter((s) => s.status === 'done').length
  const pct = Math.round((done / subtasks.length) * 100)

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Subtask Progress
        </span>
        <span className="text-xs font-bold text-slate-700">
          {done} / {subtasks.length} done · {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/* ── Subtask (main export) ────────────────────────────────── */
const Subtask = ({ todoId, isOwner, teamMembers = [] }) => {
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState('')

  /* Fetch subtasks */
  const fetchSubtasks = useCallback(async () => {
    try {
      const res = await API.get(`/todo/${todoId}/subtasks`)
      setSubtasks(res.data)
    } catch {
      /* graceful — show empty */
    } finally {
      setLoading(false)
    }
  }, [todoId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSubtasks() }, [fetchSubtasks])

  /* Group by column */
  const byColumn = (colId) => subtasks.filter((s) => s.status === colId)

  /* Drag end handler */
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId

    // Optimistic UI update
    setSubtasks((prev) =>
      prev.map((s) => (s._id === draggableId ? { ...s, status: newStatus } : s))
    )

    try {
      await API.patch(`/todo/${todoId}/subtasks/${draggableId}/status`, { status: newStatus })
    } catch {
      setError('Failed to update status. Please try again.')
      setTimeout(() => setError(''), 3000)
      // Revert on failure
      fetchSubtasks()
    }
  }

  /* Status change via tap */
  const handleStatusChange = async (subtaskId, newStatus) => {
    setSubtasks((prev) =>
      prev.map((s) => (s._id === subtaskId ? { ...s, status: newStatus } : s))
    )
    try {
      await API.patch(`/todo/${todoId}/subtasks/${subtaskId}/status`, { status: newStatus })
    } catch {
      setError('Failed to update status. Please try again.')
      setTimeout(() => setError(''), 3000)
      fetchSubtasks()
    }
  }

  /* Add subtask */
  const handleAdd = async ({ title, assignedTo }) => {
    try {
      setAddLoading(true)
      const res = await API.post(`/todo/${todoId}/subtasks`, { title, assignedTo })
      setSubtasks((prev) => [...prev, res.data])
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add subtask')
      setTimeout(() => setError(''), 3000)
    } finally {
      setAddLoading(false)
    }
  }

  /* Delete subtask */
  const handleDelete = async (subtaskId) => {
    setSubtasks((prev) => prev.filter((s) => s._id !== subtaskId))  // optimistic
    try {
      await API.delete(`/todo/${todoId}/subtasks/${subtaskId}`)
    } catch {
      fetchSubtasks()  // revert
    }
  }

  if (loading) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-400">
        Loading subtasks…
      </div>
    )
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          Subtasks{subtasks.length > 0 ? ` · ${subtasks.length}` : ''}
        </p>
        {isOwner && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-100"
          >
            <MdAdd size={14} />
            Add Subtask
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <AddSubtaskForm
          teamMembers={teamMembers}
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
          loading={addLoading}
        />
      )}

      {/* Progress */}
      {subtasks.length > 0 && (
        <div className="mt-4">
          <ProgressBar subtasks={subtasks} />
        </div>
      )}

      {/* Empty state */}
      {subtasks.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
          No subtasks yet.{isOwner ? ' Click "+ Add Subtask" to break this task down.' : ''}
        </div>
      )}

      {/* Kanban board */}
      {subtasks.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="mt-1 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const colItems = byColumn(col.id)
              return (
                <div key={col.id} className={`flex flex-col rounded-2xl border ${COLUMN_BORDER[col.id]} bg-slate-50 p-3`}>
                  {/* Column header */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="ml-auto text-[11px] font-bold text-slate-400">{colItems.length}</span>
                  </div>

                  {/* Drop zone */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[60px] space-y-2 rounded-xl p-1 transition ${
                          snapshot.isDraggingOver ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''
                        }`}
                      >
                        {colItems.map((subtask, index) => (
                          <SubtaskCard
                            key={subtask._id}
                            subtask={subtask}
                            index={index}
                            isOwner={isOwner}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}

export default Subtask
