import apiClient from './client'

export interface TrainingNotice {
  id: string
  order: number
  name: string
  description: string | null
  targetUsers: string | null
  hours: string | null
  manager: string | null
  method: string | null
  createdById: string
  createdBy: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export const getTrainingNotices = () =>
  apiClient.get<TrainingNotice[]>('/training-notices').then(r => r.data)

export const createTrainingNotice = (data: Omit<TrainingNotice, 'id' | 'createdById' | 'createdBy' | 'createdAt' | 'updatedAt'>) =>
  apiClient.post<TrainingNotice>('/training-notices', data).then(r => r.data)

export const updateTrainingNotice = (id: string, data: Omit<TrainingNotice, 'id' | 'createdById' | 'createdBy' | 'createdAt' | 'updatedAt'>) =>
  apiClient.put<TrainingNotice>(`/training-notices/${id}`, data).then(r => r.data)

export const deleteTrainingNotice = (id: string) =>
  apiClient.delete(`/training-notices/${id}`).then(r => r.data)
