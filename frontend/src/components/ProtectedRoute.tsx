import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, isAdmin, hasRole, getRole } from '../api/auth'
import type { AppRole } from '../types'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean // 호환성 유지
  allowedRoles?: AppRole[]
}

const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles }: ProtectedRouteProps) => {
  let authenticated = false
  let admin = false
  let role: AppRole = 'USER'

  try {
    authenticated = isAuthenticated()
    admin = isAdmin()
    role = getRole()

    // 디버깅: ProtectedRoute 체크 정보
    if (import.meta.env.DEV) {
      console.log('🔐 ProtectedRoute 체크:', {
        path: window.location.pathname,
        authenticated,
        admin,
        role,
        requireAdmin,
        allowedRoles,
        isAdminValue: localStorage.getItem('isAdmin'),
        roleValue: localStorage.getItem('role'),
      })
    }
  } catch (error) {
    console.error('ProtectedRoute 오류:', error)
    return <Navigate to="/login" replace />
  }

  if (!authenticated) {
    console.warn('❌ 인증되지 않음, 로그인 페이지로 이동')
    return <Navigate to="/login" replace />
  }

  if (requireAdmin) {
    if (!admin) {
      console.warn('❌ 관리자 권한 없음, 대시보드로 이동')
      return <Navigate to="/dashboard" replace />
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = hasRole(allowedRoles)
    if (!hasAccess) {
      console.warn('❌ 권한 없음:', { role, allowedRoles, hasAccess })
      // 접근 불가 시 대시보드로
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute

