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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/dashboard"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                의무연수 안내 취합 통합 플랫폼
              </Link>

              {(role === 'SUPER_ADMIN') && (
                <>
                  <Link
                    to="/dashboard/users"
                    className={`flex items-center px-4 py-2 rounded-md ${isActive('/dashboard/users') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    교직원 관리
                  </Link>
                </>
              )}

              {(role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN') && (
                <>
                  <Link
                    to="/dashboard/trainings"
                    className={`flex items-center px-4 py-2 rounded-md ${isActive('/dashboard/trainings') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    연수 관리
                  </Link>
                  <Link
                    to="/dashboard/stats"
                    className={`flex items-center px-4 py-2 rounded-md ${isActive('/dashboard/stats') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    통계
                  </Link>
                </>
              )}

              <Link
                to="/dashboard/my-trainings"
                className={`flex items-center px-4 py-2 rounded-md ${isActive('/dashboard/my-trainings') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                내 연수
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout

