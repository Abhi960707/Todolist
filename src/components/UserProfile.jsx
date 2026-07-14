import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { getStoredUser } from '../utils/auth'

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A'
  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const UserProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [userTasks, setUserTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Layout state
  const loggedInUser = getStoredUser()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [allTodos, setAllTodos] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const [profileRes, tasksRes, todosRes, teamRes, notificationsRes] = await Promise.all([
          API.get(`/auth/user/${id}`),
          API.get(`/todo/user/${id}/details`),
          API.get('/todo'),
          API.get('/auth/users'),
          API.get('/todo/notifications'),
        ])
        setProfile(profileRes.data)
        setUserTasks(tasksRes.data)
        setAllTodos(todosRes.data)
        setTeamMembers(teamRes.data.users)
        setNotifications(notificationsRes.data)
      } catch (err) {
        console.error('Error fetching user profile:', err)
        alert('Failed to load user profile.')
        navigate('/todolist')
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [id, navigate])

  // Stats for Sidebar
  const currentUserId = loggedInUser?.id || loggedInUser?._id
  const myTasks = allTodos.filter(
    (todo) =>
      todo.user?._id === currentUserId ||
      todo.user?.id === currentUserId ||
      todo.assignedTo?._id === currentUserId ||
      todo.assignedTo?.id === currentUserId
  )
  const assignedByMe = allTodos.filter(
    (todo) => (todo.assignedBy?._id === currentUserId || todo.assignedBy?.id === currentUserId) && todo.assignedTo,
  )
  const completed = allTodos.filter((todo) => todo.completed)
  const progress = allTodos.length ? Math.round((completed.length / allTodos.length) * 100) : 0
  const stats = {
    total: allTodos.length,
    progress,
    myTasks: myTasks.length,
    assignedByMe: assignedByMe.length,
  }

  if (loading) {
    return (
      <>
        <Navbar user={loggedInUser} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered} />
        <div 
          className="min-h-screen bg-slate-50 transition-[padding-left] duration-[260ms]"
          style={{ paddingLeft: isSidebarOpen || isSidebarHovered ? 272 : 68 }}
        >
          <Sidebar activeView="profile" user={loggedInUser} stats={{}} teamMembers={[]} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered} />
          <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-60px)]">
            <p className="text-slate-500 font-semibold tracking-widest uppercase">Loading Profile...</p>
          </div>
        </div>
      </>
    )
  }

  if (!profile) return null

  const assignedToThem = userTasks.filter(t => t.assignedTo?._id === id || t.assignedTo?.id === id)
  const completedTasks = userTasks.filter(t => t.completed)
  const pendingTasks = userTasks.filter(t => !t.completed)

  return (
    <>
      <Navbar 
        user={loggedInUser}
        notificationCount={notifications.length}
        onNotificationClick={() => navigate('/notifications')}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered}
      /> 
      <div 
        className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_40%,#e2e8f0_100%)] transition-[padding-left] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ paddingLeft: isSidebarOpen || isSidebarHovered ? 272 : 68 }}
      >
        <Sidebar 
          activeView="profile" 
          user={loggedInUser} 
          stats={stats} 
          teamMembers={teamMembers}
          notificationCount={notifications.length}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarHovered={setIsSidebarHovered}
        />
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-slate-500 mt-1">{profile.email}</p>
            <div className="mt-4 flex gap-3 text-sm">
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                Joined {formatDate(profile.createdAt)}
              </span>
              {profile.createdBy && (
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                  Created by {profile.createdBy.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Total Tasks</p>
            <p className="text-3xl font-bold text-slate-900">{userTasks.length}</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-emerald-600 font-semibold mb-1">Completed</p>
            <p className="text-3xl font-bold text-emerald-700">{completedTasks.length}</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-1">Pending</p>
            <p className="text-3xl font-bold text-amber-700">{pendingTasks.length}</p>
          </div>
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-1">Assigned to</p>
            <p className="text-3xl font-bold text-blue-700">{assignedToThem.length}</p>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Associated Tasks</h2>
          <div className="space-y-4">
            {userTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tasks associated with this user.</p>
            ) : (
              userTasks.slice(0, 10).map(task => (
                <div key={task._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{task.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {task.user?._id === id ? 'Created by them' : `Created by ${task.user?.name || 'Unknown'}`} 
                      {' • '}
                      {task.assignedTo?._id === id ? 'Assigned to them' : 
                        (task.assignedTo ? `Assigned to ${task.assignedTo.name}` : 'Unassigned')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <span className={`px-2 py-1 text-xs font-semibold rounded outline outline-1 ${
                      task.completed ? 'bg-emerald-50 text-emerald-700 outline-emerald-200' : 'bg-amber-50 text-amber-700 outline-amber-200'
                    }`}>
                      {task.completed ? 'Done' : 'Pending'}
                    </span>
                    <span className="text-sm text-slate-500 w-24 text-right">
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              ))
            )}
            {userTasks.length > 10 && (
              <p className="text-center text-sm text-slate-400 pt-4">Showing 10 most recent tasks.</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default UserProfile
