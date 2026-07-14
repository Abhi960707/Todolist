import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { clearAuthSession, getStoredUser } from '../utils/auth'
import API from '../api'

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
)

const Navbar = ({ notificationCount, onNotificationClick, user: propUser }) => { // Accept propUser
  const navigate = useNavigate();
  // Derive user directly from propUser or fallback to stored user
  const user = propUser || getStoredUser() || { name: 'User', email: 'guest@example.com' };
  
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [navNotifCountState, setNavNotifCountState] = useState(0)
  
  const searchRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    if (isSearchOpen && users.length === 0) {
      API.get('/auth/users').then(res => setUsers(res.data.users)).catch(console.error)
    }
  }, [isSearchOpen, users.length])

  useEffect(() => {
    if (notificationCount === undefined) {
      API.get('/todo/notifications').then(res => setNavNotifCountState(res?.data?.length || 0)).catch(() => {})
    }
  }, [notificationCount])

  const navNotifCount = notificationCount !== undefined ? notificationCount : navNotifCountState;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) { // Check for profile dropdown
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const logout = () => {
    clearAuthSession()
    navigate('/login')
  }

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick()
    } else {
      navigate('/notifications')
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5)

  const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U'

  const isAuthenticated = user && (user.id || user._id || (user.email && user.email !== 'guest@example.com'));

  return (
    <nav className="bg-white border-b border-slate-200 px-6 h-[60px] flex items-center justify-between sticky top-0 z-[105]">
      <div className="flex items-center gap-3">
        <Link to="/todolist" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center p-1 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M9 11L12 14L22 4" stroke="currentColor" className="text-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" className="text-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="items-center justify-center text-xl font-bold tracking-wide text-slate-900">Todo</span>
        </Link>
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            {isSearchOpen ? (
              <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 transition-all w-64 border border-slate-200 shadow-inner">
                <SearchIcon />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="bg-transparent border-none outline-none ml-2 text-sm w-full text-slate-800"
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition"
              >
                <SearchIcon />
              </button>
            )}

            {isSearchOpen && searchQuery && (
              <div className="absolute top-[56px] right-0 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-2 z-[110]">
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Users</div>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(u => (
                    <Link 
                      key={u.id}
                      to={`/user/${u.id}`}
                      onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                      className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition border-b border-white last:border-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">No users found.</div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button 
            onClick={handleNotificationClick}
            className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition"
          >
            <BellIcon />
            {navNotifCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border-[1.5px] border-white">
                {navNotifCount > 9 ? '9+' : navNotifCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative z-50" ref={profileRef}> {/* Attach ref here */}
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center hover:ring-2 hover:ring-blue-200 transition-all shadow-sm"
            >
              {firstLetter}
            </button>
            {isProfileOpen && (
              // Removed the fixed inset-0 div, as handleClickOutside will manage closing
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-[110] flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link 
                      to={`/user/${user.id || user._id || ""}`}
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                    >
                      My Profile
                    </Link>
                    <Link 
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                    >
                      Security & Settings
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-1 mt-auto">
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}



export default Navbar
