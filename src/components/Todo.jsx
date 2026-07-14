import React, { useRef } from 'react'
import { MdAddTask, MdAttachFile, MdClose } from 'react-icons/md'

const Todo = ({
  title,
  setTitle,
  dueDate,
  setDueDate,
  reminder,
  setReminder,
  assignedTo,
  setAssignedTo,
  assignmentNote,
  setAssignmentNote,
  attachmentFile,
  setAttachmentFile,
  teamMembers,
  addTodo,
  isSubmitting,
}) => {
  const fileInputRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) setAttachmentFile(file)
  }

  const removeFile = () => {
    setAttachmentFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_55px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[20px] font-semibold uppercase tracking-[0.94em] text-slate-400">
            Create Task
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Plan work professionally</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Add personal work or assign a task to another user with a due date, reminder, and clear note.
          </p>
        </div>
        <button
          type="button"
          onClick={addTodo}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-9 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <MdAddTask size={28} />
          {isSubmitting ? 'Saving task...' : 'Create task'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div>
            <label htmlFor="todo-title" className="mb-2 block text-sm font-semibold text-slate-700">
              Task title
            </label>
            <input
              id="todo-title"
              type="text"
              placeholder="Write the task for Assignee"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && title.trim() && addTodo()}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="assignment-note"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Task Instructions
            </label>
            <textarea
              id="assignment-note"
              placeholder="Add instructions, links, or handoff details"
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              File Attachment <span className="font-normal text-slate-400">(optional, max 10 MB)</span>
            </label>
            {attachmentFile ? (
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                <MdAttachFile size={18} className="shrink-0 text-indigo-500" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-indigo-700">
                  {attachmentFile.name}
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="shrink-0 rounded-full p-1 text-indigo-400 transition hover:bg-indigo-100 hover:text-indigo-600"
                >
                  <MdClose size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5 text-sm text-slate-500 transition hover:border-slate-400 hover:bg-white"
              >
                <MdAttachFile size={18} className="text-slate-400" />
                Click to attach a file (PDF, image, Word, Excel, ZIP…)
              </button>
            )}
            <input
              ref={fileInputRef}
              id="attachment-file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.gif,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <div>
            <label htmlFor="due-date" className="mb-2 block text-sm font-semibold text-slate-700">
              Due date
            </label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label htmlFor="assigned-user" className="mb-2 block text-sm font-semibold text-slate-700">
              Assign to
            </label>
            <select
              id="assigned-user"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            >
              <option value="">Keep as my task</option>
              {teamMembers.map((member) => (
                <option key={member.id || member._id} value={member.id || member._id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-slate-700">Reminder</span>
              <span className="block text-xs text-slate-500">Send a browser alert before due time</span>
            </span>
            <button
              type="button"
              onClick={() => setReminder(!reminder)}
              className={`relative h-7 w-12 rounded-full transition ${reminder ? 'bg-slate-900' : 'bg-slate-300'
                }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${reminder ? 'left-6' : 'left-1'
                  }`}
              />
            </button>
          </label>
        </div>
      </div>
    </section>
  )
}

export default Todo
