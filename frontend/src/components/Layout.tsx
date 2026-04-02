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
  const isStartsWith = (path: string) => location.pathname.startsWith(path)

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <nav className="bg-white shadow-lg border-b-4 border-blue-300">
        <div className="max-w-7xl mx-auto px-4">

          {/* 1행: 로고 + 로그아웃 + 햄버거 */}
          <div className="flex items-center justify-between h-14">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-blue-800 font-extrabold text-lg hover:text-blue-600 transition-colors"
            >
              🏫 <span>와석초 연수관리 플랫폼</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-base font-semibold transition-all border-2 border-red-200 hover:border-red-300"
              >
                🚪 로그아웃
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-blue-700 hover:bg-blue-50"
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

          {/* 2행: 메뉴 (데스크톱) */}
          <div className="hidden md:flex items-stretch gap-1 pb-1 overflow-x-auto">
            {/* 단일행 메뉴 공통 클래스: h-12 flex items-center */}
            <Link
              to="/dashboard/training-notice"
              className={`flex items-center px-4 h-12 rounded-t-lg text-base font-bold transition-all whitespace-nowrap ${isActive('/dashboard/training-notice') ? 'bg-blue-500 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
            >
              📋 연수 안내
            </Link>

            {role === 'SUPER_ADMIN' && (
              <Link
                to="/dashboard/users"
                className={`flex items-center px-4 h-12 rounded-t-lg text-base font-bold transition-all whitespace-nowrap ${isActive('/dashboard/users') ? 'bg-blue-500 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
              >
                👥 교직원 관리
              </Link>
            )}

            {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
              <Link
                to="/dashboard/trainings"
                className={`flex items-center px-4 h-12 rounded-t-lg text-base font-bold transition-all whitespace-nowrap ${isActive('/dashboard/trainings') ? 'bg-blue-500 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
              >
                📖 연수 관리
              </Link>
            )}

            {/* 연수등록부 — 2줄이지만 h-12로 높이 고정 */}
            <Link
              to="/dashboard/signature-book"
              className={`flex flex-col justify-center px-4 h-12 rounded-t-lg text-base font-bold transition-all whitespace-nowrap leading-tight ${isStartsWith('/dashboard/signature-book') ? 'bg-blue-500 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
            >
              <span>✍️ 연수등록부</span>
              <span className={`text-xs font-medium leading-none ${isStartsWith('/dashboard/signature-book') ? 'text-blue-100' : 'text-blue-400'}`}>서명하기</span>
            </Link>

            {/* 회의등록부 — 2줄이지만 h-12로 높이 고정 */}
            <Link
              to="/dashboard/meetings"
              className={`flex flex-col justify-center px-4 h-12 rounded-t-lg text-base font-bold transition-all whitespace-nowrap leading-tight ${isStartsWith('/dashboard/meetings') ? 'bg-blue-500 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
            >
              <span>📝 회의등록부</span>
              <span className={`text-xs font-medium leading-none ${isStartsWith('/dashboard/meetings') ? 'text-blue-100' : 'text-blue-400'}`}>서명하기</span>
            </Link>

            <Link
              to="/dashboard/my-trainings"
              className={`flex items-center px-4 h-12 rounded-t-lg text-base font-bold transition-all whitespace-nowrap ${isActive('/dashboard/my-trainings') ? 'bg-blue-500 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
            >
              ✏️ 내 연수
            </Link>

            {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
              <Link
                to="/dashboard/stats"
                className={`flex items-center px-4 h-12 rounded-t-lg text-base font-bold transition-all whitespace-nowrap ${isActive('/dashboard/stats') ? 'bg-blue-500 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
              >
                📊 통계
              </Link>
            )}

            <Link
              to="/dashboard/profile"
              className={`flex items-center px-4 h-12 rounded-t-lg text-base font-bold transition-all whitespace-nowrap ${isActive('/dashboard/profile') ? 'bg-blue-500 text-white shadow' : 'text-blue-700 hover:bg-blue-50'}`}
            >
              👤 내 정보
            </Link>
          </div>
        </div>

        {/* 모바일 드롭다운 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-blue-100 px-3 py-2 space-y-1">
            <Link to="/dashboard/training-notice" onClick={closeMenu}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold ${isActive('/dashboard/training-notice') ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
              📋 연수 안내
            </Link>
            {role === 'SUPER_ADMIN' && (
              <Link to="/dashboard/users" onClick={closeMenu}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold ${isActive('/dashboard/users') ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
                👥 교직원 관리
              </Link>
            )}
            {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
              <Link to="/dashboard/trainings" onClick={closeMenu}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold ${isActive('/dashboard/trainings') ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
                📖 연수 관리
              </Link>
            )}
            <Link to="/dashboard/signature-book" onClick={closeMenu}
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-semibold ${isStartsWith('/dashboard/signature-book') ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
              <span>✍️ 연수등록부</span>
              <span className={`text-sm ${isStartsWith('/dashboard/signature-book') ? 'text-blue-100' : 'text-blue-400'}`}>서명하기</span>
            </Link>
            <Link to="/dashboard/meetings" onClick={closeMenu}
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-semibold ${isStartsWith('/dashboard/meetings') ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
              <span>📝 회의등록부</span>
              <span className={`text-sm ${isStartsWith('/dashboard/meetings') ? 'text-blue-100' : 'text-blue-400'}`}>서명하기</span>
            </Link>
            <Link to="/dashboard/my-trainings" onClick={closeMenu}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold ${isActive('/dashboard/my-trainings') ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
              ✏️ 내 연수
            </Link>
            {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
              <Link to="/dashboard/stats" onClick={closeMenu}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold ${isActive('/dashboard/stats') ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
                📊 통계
              </Link>
            )}
            <Link to="/dashboard/profile" onClick={closeMenu}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold ${isActive('/dashboard/profile') ? 'bg-blue-500 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
              👤 내 정보
            </Link>
            <button
              onClick={() => { handleLogout(); closeMenu() }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50 w-full text-left border-t border-gray-100 mt-1"
            >
              🚪 로그아웃
            </button>
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
