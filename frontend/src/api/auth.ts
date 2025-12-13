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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:48',message:'login API 호출 시작',data:{email:email||'없음',hasPassword:!!password,passwordLength:password.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  // 이메일이 빈 문자열이면 undefined로 전달 (백엔드에서 선택사항으로 처리)
  const requestBody = email && email.trim() ? { email: email.trim(), password } : { password }
  const response = await apiClient.post<AuthResponse>('/auth/login', requestBody)
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:50',message:'login API 응답 수신',data:{success:response.data.success,hasToken:!!response.data.token,isAdmin:response.data.isAdmin,role:response.data.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token)
    // isAdmin이 명시적으로 true/false인지 확인하고 저장
    const isAdminValue = response.data.isAdmin === true || String(response.data.isAdmin) === 'true'
    localStorage.setItem('isAdmin', String(isAdminValue))
    // role이 있으면 사용하고, 없으면 isAdmin에 따라 결정
    const role = response.data.role || (isAdminValue ? 'SUPER_ADMIN' : 'USER')
    localStorage.setItem('role', role)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:58',message:'localStorage 저장 완료',data:{savedToken:!!localStorage.getItem('token'),savedIsAdmin:localStorage.getItem('isAdmin'),savedRole:localStorage.getItem('role'),originalIsAdmin:response.data.isAdmin,originalRole:response.data.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
  try {
    return localStorage.getItem('isAdmin') === 'true'
  } catch (error) {
    console.error('isAdmin 오류:', error)
    return false
  }
}

export const isAuthenticated = (): boolean => {
  try {
    return !!localStorage.getItem('token')
  } catch (error) {
    console.error('isAuthenticated 오류:', error)
    return false
  }
}

export const getRole = (): AppRole => {
  try {
    const role = localStorage.getItem('role') as AppRole | null
    if (role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN' || role === 'USER') return role
    return isAdmin() ? 'SUPER_ADMIN' : 'USER'
  } catch (error) {
    console.error('getRole 오류:', error)
    return 'USER'
  }
}

export const hasRole = (allowed: AppRole[]): boolean => {
  const role = getRole()
  if (allowed.includes('SUPER_ADMIN') && role === 'SUPER_ADMIN') return true
  if (allowed.includes('TRAINING_ADMIN') && (role === 'TRAINING_ADMIN' || role === 'SUPER_ADMIN')) return true
  if (allowed.includes('USER') && (role === 'USER' || role === 'TRAINING_ADMIN' || role === 'SUPER_ADMIN')) return true
  return false
}

// Google 로그인
export const loginGoogle = async (token: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login-google', { token })
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

// 회원가입 (일반 사용자용, 인증 불필요)
export const register = async (userData: {
  name: string
  email: string
  userType: string
  position?: string
  grade?: string
  class?: string
}): Promise<{ success: boolean; message: string }> => {
  // 회원가입은 인증이 필요 없으므로 별도 클라이언트 사용
  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://studycheck.onrender.com/api')
  const response = await fetch(`${apiUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || '회원가입에 실패했습니다.')
  }
  return data
}

