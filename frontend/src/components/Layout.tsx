import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const role = (localStorage.getItem('role') as 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER' | null) || 'USER'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  const linkBase = 'flex items-center whitespace-nowrap px-3 py-2 mx-0.5 rounded-lg text-sm font-semibold transition-all'
  const linkActive = 'bg-blue-500 text-white shadow-md'
  const linkInactive = 'text-blue-700 hover:bg-blue-100'

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <nav className="bg-white shadow-lg border-b-4 border-blue-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-1">
            <Link
              to="/dashboard"
              className="flex items-center whitespace-nowrap px-3 py-2 text-blue-700 hover:bg-blue-50 rounded-lg font-bold text-sm transition-all shrink-0"
            >
              📚 와석초 의무연수
            </Link>

            <div className="flex items-center gap-0.5 overflow-x-auto">
              {(role === 'SUPER_ADMIN') && (
                <Link
                  to="/dashboard/users"
                  className={`${linkBase} ${isActive('/dashboard/users') ? linkActive : linkInactive}`}
                >
                  👥 교직원 관리
                </Link>
              )}

              {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
                <>
                  <Link
                    to="/dashboard/trainings"
                    className={`${linkBase} ${isActive('/dashboard/trainings') ? linkActive : linkInactive}`}
                  >
                    📖 연수 관리
                  </Link>
                  <Link
                    to="/dashboard/stats"
                    className={`${linkBase} ${isActive('/dashboard/stats') ? linkActive : linkInactive}`}
                  >
                    📊 통계
                  </Link>
                </>
              )}

              <Link
                to="/dashboard/signature-book"
                className={`${linkBase} ${location.pathname.startsWith('/dashboard/signature-book') ? linkActive : linkInactive}`}
              >
                ✍️ 연수등록부 서명하기
              </Link>

              <Link
                to="/dashboard/my-trainings"
                className={`${linkBase} ${isActive('/dashboard/my-trainings') ? linkActive : linkInactive}`}
              >
                ✏️ 내 연수
              </Link>

              <Link
                to="/dashboard/profile"
                className={`${linkBase} ${isActive('/dashboard/profile') ? linkActive : linkInactive}`}
              >
                👤 내 정보
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center whitespace-nowrap px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-all border-2 border-red-200 hover:border-red-300 shrink-0"
            >
              🚪 로그아웃
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
