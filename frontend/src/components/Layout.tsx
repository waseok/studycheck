import { useState, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const role = (localStorage.getItem('role') as 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER' | null) || 'USER'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  const linkBase = 'flex items-center whitespace-nowrap px-3 py-2 mx-0.5 rounded-lg text-sm font-semibold transition-all'
  const linkActive = 'bg-blue-500 text-white shadow-md'
  const linkInactive = 'text-blue-700 hover:bg-blue-100'

  const mobileLinkBase = 'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all'
  const mobileLinkActive = 'bg-blue-500 text-white'
  const mobileLinkInactive = 'text-blue-700 hover:bg-blue-50'

  const closeMenu = () => setMobileMenuOpen(false)

  const menuItems = (
    <>
      <Link
        to="/dashboard/training-notice"
        className={`${linkBase} ${isActive('/dashboard/training-notice') ? linkActive : linkInactive}`}
      >
        📋 연수 안내
      </Link>
      {role === 'SUPER_ADMIN' && (
        <Link
          to="/dashboard/users"
          className={`${linkBase} ${isActive('/dashboard/users') ? linkActive : linkInactive}`}
        >
          👥 교직원 관리
        </Link>
      )}
      {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
        <Link
          to="/dashboard/trainings"
          className={`${linkBase} ${isActive('/dashboard/trainings') ? linkActive : linkInactive}`}
        >
          📖 연수 관리
        </Link>
      )}
      <Link
        to="/dashboard/signature-book"
        className={`${linkBase} ${location.pathname.startsWith('/dashboard/signature-book') ? linkActive : linkInactive}`}
      >
        ✍️ 연수등록부
      </Link>
      <Link
        to="/dashboard/meetings"
        className={`${linkBase} ${location.pathname.startsWith('/dashboard/meetings') ? linkActive : linkInactive}`}
      >
        📝 회의등록부
      </Link>
      <Link
        to="/dashboard/my-trainings"
        className={`${linkBase} ${isActive('/dashboard/my-trainings') ? linkActive : linkInactive}`}
      >
        ✏️ 내 연수
      </Link>
      {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
        <Link
          to="/dashboard/stats"
          className={`${linkBase} ${isActive('/dashboard/stats') ? linkActive : linkInactive}`}
        >
          📊 통계
        </Link>
      )}
      <Link
        to="/dashboard/profile"
        className={`${linkBase} ${isActive('/dashboard/profile') ? linkActive : linkInactive}`}
      >
        👤 내 정보
      </Link>
    </>
  )

  const mobileMenuItems = (
    <>
      <Link
        to="/dashboard/training-notice"
        onClick={closeMenu}
        className={`${mobileLinkBase} ${isActive('/dashboard/training-notice') ? mobileLinkActive : mobileLinkInactive}`}
      >
        📋 연수 안내
      </Link>
      {role === 'SUPER_ADMIN' && (
        <Link
          to="/dashboard/users"
          onClick={closeMenu}
          className={`${mobileLinkBase} ${isActive('/dashboard/users') ? mobileLinkActive : mobileLinkInactive}`}
        >
          👥 교직원 관리
        </Link>
      )}
      {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
        <Link
          to="/dashboard/trainings"
          onClick={closeMenu}
          className={`${mobileLinkBase} ${isActive('/dashboard/trainings') ? mobileLinkActive : mobileLinkInactive}`}
        >
          📖 연수 관리
        </Link>
      )}
      <Link
        to="/dashboard/signature-book"
        onClick={closeMenu}
        className={`${mobileLinkBase} ${location.pathname.startsWith('/dashboard/signature-book') ? mobileLinkActive : mobileLinkInactive}`}
      >
        ✍️ 연수등록부
      </Link>
      <Link
        to="/dashboard/meetings"
        onClick={closeMenu}
        className={`${mobileLinkBase} ${location.pathname.startsWith('/dashboard/meetings') ? mobileLinkActive : mobileLinkInactive}`}
      >
        📝 회의등록부
      </Link>
      <Link
        to="/dashboard/my-trainings"
        onClick={closeMenu}
        className={`${mobileLinkBase} ${isActive('/dashboard/my-trainings') ? mobileLinkActive : mobileLinkInactive}`}
      >
        ✏️ 내 연수
      </Link>
      {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
        <Link
          to="/dashboard/stats"
          onClick={closeMenu}
          className={`${mobileLinkBase} ${isActive('/dashboard/stats') ? mobileLinkActive : mobileLinkInactive}`}
        >
          📊 통계
        </Link>
      )}
      <Link
        to="/dashboard/profile"
        onClick={closeMenu}
        className={`${mobileLinkBase} ${isActive('/dashboard/profile') ? mobileLinkActive : mobileLinkInactive}`}
      >
        👤 내 정보
      </Link>
      <button
        onClick={() => { handleLogout(); closeMenu() }}
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-all w-full text-left border-t border-gray-100 mt-1"
      >
        🚪 로그아웃
      </button>
    </>
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <nav className="bg-white shadow-lg border-b-4 border-blue-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-1">
            {/* 로고 */}
            <Link
              to="/dashboard"
              className="flex items-center whitespace-nowrap px-2 py-2 text-blue-700 hover:bg-blue-50 rounded-lg font-bold text-sm transition-all shrink-0"
            >
              🏫 와석초 연수관리 플랫폼
            </Link>

            {/* 데스크톱 메뉴 */}
            <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
              {menuItems}
            </div>

            {/* 데스크톱 로그아웃 + 모바일 햄버거 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center whitespace-nowrap px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-all border-2 border-red-200 hover:border-red-300 shrink-0"
              >
                🚪 로그아웃
              </button>

              {/* 모바일 햄버거 버튼 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-blue-700 hover:bg-blue-50 transition-all"
                aria-label="메뉴"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-blue-100 px-3 py-2 space-y-1">
            {mobileMenuItems}
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
