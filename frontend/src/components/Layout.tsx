import { useMemo, useState, useEffect, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout, getRole, syncRoleFromServer, isAdmin } from '../api/auth'
import { getRoleRequests } from '../api/roleRequests'
import { AppRole } from '../types'

interface LayoutProps {
  children: ReactNode
}

interface MenuItem {
  to: string
  label: string
  subLabel?: string
  show: boolean
  startsWith: boolean
  badge?: number
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [role, setRole] = useState<AppRole>(() => getRole())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingRoleRequestCount, setPendingRoleRequestCount] = useState(0)

  // 승인 등으로 DB 권한이 바뀌면 메뉴를 자동 반영
  useEffect(() => {
    const sync = async () => {
      const updatedRole = await syncRoleFromServer()
      if (updatedRole) setRole(updatedRole)
    }
    sync()
    const interval = setInterval(sync, 20000)
    return () => clearInterval(interval)
  }, [])

  // 최고관리자: 연수 관리 권한 요청 건수 표시
  useEffect(() => {
    if (!isAdmin()) {
      setPendingRoleRequestCount(0)
      return
    }

    const fetchPending = async () => {
      try {
        const requests = await getRoleRequests()
        setPendingRoleRequestCount(requests.filter((r) => r.status === 'PENDING').length)
      } catch {
        // 조용히 무시
      }
    }

    fetchPending()
    const interval = setInterval(fetchPending, 20000)
    return () => clearInterval(interval)
  }, [role])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path
  const isStartsWith = (path: string) => location.pathname.startsWith(path)

  const closeMenu = () => setMobileMenuOpen(false)
  const menuItems = useMemo(() => {
    const base: MenuItem[] = [
      { to: '/dashboard/training-notice', label: '📋 연수 안내', show: true, startsWith: false },
      { to: '/dashboard/users', label: '👥 교직원 관리', show: role === 'SUPER_ADMIN', startsWith: false, badge: pendingRoleRequestCount > 0 ? pendingRoleRequestCount : undefined },
      { to: '/dashboard/trainings', label: '📖 연수 관리', show: role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN', startsWith: false },
      { to: '/dashboard/signature-book', label: '✍️ 연수등록부', subLabel: '서명하기', show: true, startsWith: true },
      { to: '/dashboard/meetings', label: '📝 회의등록부', subLabel: '서명하기', show: true, startsWith: true },
      { to: '/dashboard/my-trainings', label: '✏️ 내 연수', show: true, startsWith: false },
      { to: '/dashboard/stats', label: '📊 통계', show: role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN', startsWith: false },
      { to: '/dashboard/profile', label: '👤 내 정보', show: true, startsWith: false, badge: isAdmin() && pendingRoleRequestCount > 0 ? pendingRoleRequestCount : undefined },
    ]
    return base.filter(item => item.show)
  }, [role, pendingRoleRequestCount])

  return (
    <div className="min-h-screen bg-sky-50">
      <div className="md:hidden bg-white shadow border-b border-blue-100">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="text-blue-800 font-extrabold text-lg flex items-center gap-2">
            <img src="/school-logo.webp" alt="와석초등학교 교표" className="h-9 w-9 object-contain" />
            <span>와석초 연수관리 플랫폼</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-lg text-blue-700 hover:bg-blue-50"
            aria-label="메뉴"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="px-3 pb-3 space-y-1 border-t border-blue-100">
            {menuItems.map(item => {
              const active = item.startsWith ? isStartsWith(item.to) : isActive(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className={`flex items-center justify-between px-5 py-3 rounded-lg text-base font-extrabold ${active ? 'bg-blue-500 text-white' : 'text-blue-900 hover:bg-blue-50'}`}
                >
                  <span>{item.label}</span>
                  <span className="flex items-center gap-2">
                    {item.badge != null && item.badge > 0 && (
                      <span
                        className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${active ? 'bg-white text-red-600' : 'bg-red-600 text-white'}`}
                        title="연수 관리 권한 요청"
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.subLabel && <span className={`text-sm font-semibold ${active ? 'text-blue-100' : 'text-blue-600'}`}>{item.subLabel}</span>}
                  </span>
                </Link>
              )
            })}
            <button onClick={() => { handleLogout(); closeMenu() }} className="w-full text-left px-5 py-3 rounded-lg text-red-700 hover:bg-red-50 border-t border-gray-100 font-extrabold">
              🚪 로그아웃
            </button>
          </div>
        )}
      </div>

      <div className="md:flex">
        <aside className="hidden md:flex md:w-80 md:flex-shrink-0 min-h-screen bg-white border-r border-blue-100 shadow-sm flex-col">
          <div className="h-24 flex items-center justify-center px-5 border-b border-blue-100">
            <Link to="/dashboard" className="text-blue-800 text-center leading-tight flex flex-col items-center">
              <img src="/school-logo.webp" alt="와석초등학교 교표" className="h-11 w-11 object-contain mb-1" />
              <div className="font-extrabold text-2xl tracking-tight">와석초 연수관리 플랫폼</div>
            </Link>
          </div>
          <nav className="p-3 space-y-1">
            {menuItems.map(item => {
              const active = item.startsWith ? isStartsWith(item.to) : isActive(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-5 py-3 rounded-xl text-lg font-extrabold transition ${active ? 'bg-blue-500 text-white shadow' : 'text-blue-900 hover:bg-blue-50'}`}
                >
                  <span>{item.label}</span>
                  <span className="flex items-center gap-2">
                    {item.badge != null && item.badge > 0 && (
                      <span
                        className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${active ? 'bg-white text-red-600' : 'bg-red-600 text-white'}`}
                        title="연수 관리 권한 요청"
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.subLabel && <span className={`text-xs font-semibold ${active ? 'text-blue-100' : 'text-blue-600'}`}>{item.subLabel}</span>}
                  </span>
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto p-3 border-t border-blue-100">
            <button
              onClick={handleLogout}
              className="w-full px-5 py-3 text-red-700 rounded-xl border border-red-200 hover:bg-red-50 font-extrabold"
            >
              🚪 로그아웃
            </button>
          </div>
        </aside>

        <main className="flex-1 py-6 md:py-8 md:px-6 lg:px-8 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
