import apiClient from './client'

export interface StaffGroupMember {
  id: string
  userId: string
  user: {
    id: string
    name: string
    userType: string
    position: string | null
  }
}

export interface StaffGroup {
  id: string
  name: string
  createdAt: string
  members: StaffGroupMember[]
}

export const getGroups = async (): Promise<StaffGroup[]> => {
  const response = await apiClient.get<StaffGroup[]>('/groups')
  return response.data
}

export const createGroup = async (name: string, memberIds?: string[]): Promise<StaffGroup> => {
  const response = await apiClient.post<StaffGroup>('/groups', { name, memberIds })
  return response.data
}

export const updateGroup = async (id: string, name: string): Promise<StaffGroup> => {
  const response = await apiClient.put<StaffGroup>(`/groups/${id}`, { name })
  return response.data
}

export const deleteGroup = async (id: string): Promise<void> => {
  await apiClient.delete(`/groups/${id}`)
}

export const addGroupMembers = async (groupId: string, memberIds: string[]): Promise<StaffGroup> => {
  const response = await apiClient.post<StaffGroup>(`/groups/${groupId}/members`, { memberIds })
  return response.data
}

export const removeGroupMember = async (groupId: string, userId: string): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}/members/${userId}`)
}
