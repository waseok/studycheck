import apiClient from './client'
import { AuthResponse, AppRole } from '../types'

export interface LoginResponse extends AuthResponse {
  mustSetPin?: boolean
}

// 초기 비밀번호로 로그인
export const loginInitial = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login-initial', { email, password })
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('isAdmin', String(response.data.isAdmin || false))
    if (response.data.role) {
      localStorage.setItem('role', response.data.role)
    } else {
      localStorage.setItem('role', response.data.isAdmin ? 'SUPER_ADMIN' : 'USER')
    }
  }
  return response.data
}

// PIN으로 로그인
export const loginPin = async (email: string, pin: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login-pin', { email, pin })
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('isAdmin', String(response.data.isAdmin || false))
    if (response.data.role) {
      localStorage.setItem('role', response.data.role)
    } else {
      localStorage.setItem('role', response.data.isAdmin ? 'SUPER_ADMIN' : 'USER')
    }
  }
  return response.data
}

// PIN 설정
export const setPin = async (pin: string): Promise<{ success: boolean; token: string; message: string }> => {
  const response = await apiClient.post<{ success: boolean; token: string; message: string }>('/auth/set-pin', { pin })
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token)
  }
  return response.data
}

// 기존 login 함수 (호환성)
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', { email, password })
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('isAdmin', String(response.data.isAdmin))
    if (response.data.role) {
      localStorage.setItem('role', response.data.role)
    } else {
      localStorage.setItem('role', response.data.isAdmin ? 'SUPER_ADMIN' : 'USER')
    }
  }
  return response.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('isAdmin')
  localStorage.removeItem('role')
  window.location.href = '/login'
}

export const isAdmin = (): boolean => {
  return localStorage.getItem('isAdmin') === 'true'
}

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token')
}

export const getRole = (): AppRole => {
  const role = localStorage.getItem('role') as AppRole | null
  if (role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN' || role === 'USER') return role
  return isAdmin() ? 'SUPER_ADMIN' : 'USER'
}

export const hasRole = (allowed: AppRole[]): boolean => {
  const role = getRole()
  if (allowed.includes('SUPER_ADMIN') && role === 'SUPER_ADMIN') return true
  if (allowed.includes('TRAINING_ADMIN') && (role === 'TRAINING_ADMIN' || role === 'SUPER_ADMIN')) return true
  if (allowed.includes('USER') && (role === 'USER' || role === 'TRAINING_ADMIN' || role === 'SUPER_ADMIN')) return true
  return false
}

