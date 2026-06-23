import apiClient from './client'
import { RoleRequest } from '../types'

export const createRoleRequest = async (message: string): Promise<RoleRequest> => {
  const response = await apiClient.post<{ success: boolean; request: RoleRequest }>('/role-requests', { message })
  return response.data.request
}

export const getRoleRequests = async (): Promise<RoleRequest[]> => {
  const response = await apiClient.get<{ requests: RoleRequest[] }>('/role-requests')
  return response.data.requests
}

export const approveRoleRequest = async (id: string): Promise<void> => {
  await apiClient.patch(`/role-requests/${id}/approve`)
}

export const rejectRoleRequest = async (id: string, rejectReason: string): Promise<void> => {
  await apiClient.patch(`/role-requests/${id}/reject`, { rejectReason })
}
