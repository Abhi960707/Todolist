import React, { useCallback, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clearAuthSession } from '../utils/auth'
import {
  MdAssignmentTurnedIn,
  MdChecklist,
  MdDashboard,
  MdKeyboardArrowDown,
  MdPeople,
  MdLogout,
} from 'react-icons/md'

/* ═══════════════════════════ Sidebar ═══════════════════════════ */
export default function Sidebar({
  activeView,
  setActiveView,
  stats,
  user,
  teamMembers,
  notificationCount,
  isSidebarOpen,
  setIsSidebarOpen,
  setIsSidebarHovered,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  /* ── calculate my team count ── */
  const currentUserId = user?.id || user?._id;
  const myTeamCount = teamMembers?.filter((m) => {
    const creator = m.createdBy?._id || m.createdBy?.id || m.createdBy;
    return creator === currentUserId;
  }).length || 0;

  /* ── hover / panel state ── */
  const [hovered, setHovered] = useState(false)

  // Sidebar is expanded if isSidebarOpen (from parent) is true, or if hovered
  const expanded = isSidebarOpen || hovered

  /* ── hover delay ── */
  const leaveTimer = useRef(null)
  const onEnter = useCallback(() => { 
    clearTimeout(leaveTimer.current); 
    setHovered(true);
    if (setIsSidebarHovered) setIsSidebarHovered(true);
  }, [setIsSidebarHovered])
  
  const onLeave = useCallback(() => { 
    leaveTimer.current = setTimeout(() => {
      setHovered(false);
      if (setIsSidebarHovered) setIsSidebarHovered(false);
    }, 150) 
  }, [setIsSidebarHovered])

  /* ── handlers ── */
  const logout = () => { clearAuthSession(); navigate('/login') }

  const handleNav = (id) => {
    if (location.pathname !== '/todolist') {
      navigate('/todolist', { state: { targetView: id } })
    } else if (setActiveView) {
      setActiveView(id)
    }
    if (window.innerWidth < 768) setHovered(false)
  }

  /* ── micro helpers ── */
  const sectionLabel = expanded
    ? 'block px-4 pt-4 pb-1 text-[10px] font-bold tracking-[0.28em] uppercase text-white/30'
    : 'hidden'

  /* ── reusable nav button renderer ── */
  // eslint-disable-next-line no-unused-vars
  const renderNavBtn = ({ Icon, label, sublabel, badge, active, onClick }) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className="relative flex w-full cursor-pointer items-center border-none outline-none transition-colors duration-150"
      style={{ background: active ? 'rgba(255,255,255,0.10)' : 'transparent' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? 'rgba(255,255,255,0.10)' : 'transparent' }}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-indigo-400" />}
      <span
        className="flex h-[52px] w-[68px] min-w-[68px] flex-shrink-0 items-center justify-center text-[20px] transition-colors"
        style={{ color: active ? '#fff' : 'rgba(255,255,255,0.50)' }}
      >
        <Icon size={22} />
      </span>
      {expanded && (
        <span className="flex min-w-0 flex-1 flex-col pr-3">
          <span className={`text-[13px] font-semibold leading-tight ${active ? 'text-white' : 'text-white/85'}`}>{label}</span>
          {sublabel && <span className="mt-[1px] text-[11px] text-white/38">{sublabel}</span>}
        </span>
      )}
      {expanded && badge !== undefined && (
        <span className={`mr-3 flex-shrink-0 rounded-full px-[7px] py-[2px] text-[11px] font-bold ${
          active ? 'bg-indigo-500 text-white' : 'bg-white/12 text-white/65'
        }`}>{badge}</span>
      )}
    </button>
  )

  /* ── render ── */
  return (
    <>
      {/* Mobile overlay — closes hover state on tap */}
      {expanded && (
        <div
          className="fixed inset-0 top-[60px] z-[90] bg-black/40 md:hidden"
          onClick={() => setHovered(false)}
        />
      )}

      <aside
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="fixed left-0 top-[60px] z-[100] flex h-[calc(100vh-60px)] flex-col overflow-hidden border-r border-white/7 bg-[#0f172a] transition-[width] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ width: expanded ? 272 : 68, boxShadow: expanded ? '6px 0 40px rgba(0,0,0,0.35)' : 'none' }}
      >
        {/* ══ SCROLLABLE TOP SECTION ══ */}
        <div
          className="flex flex-1 min-h-0 w-[272px] min-w-[272px] flex-col overflow-x-hidden overflow-y-auto py-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.10) transparent' }}
        >
          {/* ── Logo & collapse btn ── */}
          <div className="flex items-center gap-3 border-b border-white/7 px-[14px] pb-4">
            <div
              className="flex h-10 w-10 min-w-[40px] items-center justify-center rounded-[13px] text-[17px] font-extrabold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              T
            </div>
            {expanded && <span className="text-[14px] font-bold text-white truncate">Todo Workspace</span>}
            {expanded && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse sidebar"
                className="ml-auto p-1.5 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition flex-shrink-0"
              >
                <MdKeyboardArrowDown size={18} className="rotate-90" />
              </button>
            )}
          </div>

          {/* ── Stats chips ── */}
          {expanded && (
            <div className="flex gap-1.5 px-[14px] py-2.5">
              {[
                { v: `${stats?.progress || 0}%`, k: 'Done' },
                { v: stats?.total || 0,          k: 'Total' },
                { v: notificationCount || 0,    k: 'Alerts' },
              ].map(({ v, k }) => (
                <div key={k} className="flex-1 rounded-[10px] px-2 py-[7px] text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <span className="block text-[16px] font-bold text-white">{v}</span>
                  <span className="block mt-[1px] text-[9px] uppercase tracking-[0.2em] text-white/32">{k}</span>
                </div>
              ))}
            </div>
          )}

          {/* ═══ NAVIGATION ═══ */}
          <div className={sectionLabel}>Navigation</div>

          <div className="group">
            {renderNavBtn({
              Icon: MdDashboard, label: 'Dashboard', sublabel: 'Overview & stats',
              badge: stats.total, active: activeView === 'overview',
              onClick: () => handleNav('overview'),
            })}
          </div>

          <div className="group">
            {renderNavBtn({
              Icon: MdChecklist, label: 'My Tasks', sublabel: 'All your tasks',
              badge: stats.myTasks, active: activeView === 'my-tasks',
              onClick: () => handleNav('my-tasks'),
            })}
          </div>

          <div className="group">
            {renderNavBtn({
              Icon: MdPeople, label: 'Team', sublabel: 'Manage team & users',
              badge: myTeamCount, active: activeView === 'team',
              onClick: () => handleNav('team'),
            })}
          </div>

          <div className="group">
            {renderNavBtn({
              Icon: MdAssignmentTurnedIn, label: 'Assign Task', sublabel: 'Create & delegate tasks',
              badge: stats.assignedByMe, active: activeView === 'assigned-by-me',
              onClick: () => handleNav('assigned-by-me'),
            })}
          </div>

          <div className="group mt-2">
            <button
              type="button"
              onClick={logout}
              className="relative flex w-full cursor-pointer items-center border-none outline-none transition-colors duration-150"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              title="Logout"
            >
              <span className="flex h-[52px] w-[68px] min-w-[68px] flex-shrink-0 items-center justify-center text-[20px] text-red-500 transition-colors">
                <MdLogout size={22} />
              </span>
              {expanded && (
                <span className="flex min-w-0 flex-1 flex-col pr-3">
                  <span className="text-[13px] font-semibold leading-tight text-red-500">Logout</span>
                  <span className="mt-[1px] text-[11px] text-red-500/70">Sign out of your account</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
