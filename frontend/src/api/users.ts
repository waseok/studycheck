import apiClient from './client'
import { User } from '../types'

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users')
  return response.data
}

export const createUser = async (data: {
  name: string
  email: string
  userType?: string
  position?: string
  grade?: string
  class?: string
  role?: 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER'
}): Promise<User> => {
  const response = await apiClient.post<User>('/users', data)
  return response.data
}

export const updateUser = async (
  id: string,
  data: Partial<{ name: string; email: string; userType: string; position?: string; grade?: string; class?: string; role: 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER' }>
): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`)
}

export const resetPin = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(`/users/${id}/reset-pin`)
  return response.data
}

export const bulkCreateUsers = async (file: File): Promise<{ success: boolean; message: string; count: number; users: User[] }> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiClient.post<{ success: boolean; message: string; count: number; users: User[] }>(
    '/users/bulk',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}

// 현재 로그인한 사용자 정보 조회
export const getMyProfile = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me')
  return response.data
}// 현재 로그인한 사용자 정보 수정
export const updateMyProfile = async (data: {
  name?: string
  email?: string
  userType?: string
  position?: string
  grade?: string
  class?: string
}): Promise<{ success: boolean; message: string; user: User }> => {
  const response = await apiClient.put<{ success: boolean; message: string; user: User }>('/users/me', data)
  return response.data
}