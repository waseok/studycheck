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

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <nav className="bg-white shadow-lg border-b-4 border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="flex items-center px-5 py-3 text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-lg transition-all"
              >
                📚 와석초 의무연수 안내 취합 통합 플랫폼
              </Link>

              {(role === 'SUPER_ADMIN') && (
                <>
                  <Link
                    to="/dashboard/users"
                    className={`flex items-center px-5 py-3 mx-1 rounded-xl font-semibold transition-all ${
                      isActive('/dashboard/users') 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    👥 교직원 관리
                  </Link>
                </>
              )}

              {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
                <>
                  <Link
                    to="/dashboard/trainings"
                    className={`flex items-center px-5 py-3 mx-1 rounded-xl font-semibold transition-all ${
                      isActive('/dashboard/trainings') 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    📖 연수 관리
                  </Link>
                  <Link
                    to="/dashboard/stats"
                    className={`flex items-center px-5 py-3 mx-1 rounded-xl font-semibold transition-all ${
                      isActive('/dashboard/stats') 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    📊 통계
                  </Link>
                </>
              )}

              <Link
                to="/dashboard/my-trainings"
                className={`flex items-center px-5 py-3 mx-1 rounded-xl font-semibold transition-all ${
                  isActive('/dashboard/my-trainings') 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                ✏️ 내 연수
              </Link>
              <Link
                to="/dashboard/profile"
                className={`flex items-center px-5 py-3 mx-1 rounded-xl font-semibold transition-all ${
                  isActive('/dashboard/profile') 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                👤 내 정보
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-5 py-3 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-all border-2 border-red-200 hover:border-red-300"
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

