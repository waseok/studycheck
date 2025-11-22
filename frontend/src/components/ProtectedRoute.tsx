import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, isAdmin, hasRole } from '../api/auth'
import type { AppRole } from '../types'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean // 호환성 유지
  allowedRoles?: AppRole[]
}

const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles }: ProtectedRouteProps) => {
  const authenticated = isAuthenticated()

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin) {
    if (!isAdmin()) {
      return <Navigate to="/dashboard" replace />
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      // 접근 불가 시 대시보드로
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute

