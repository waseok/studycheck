import apiClient from './client'
import { Training } from '../types'

export const getTrainings = async (): Promise<Training[]> => {
  const response = await apiClient.get<Training[]>('/trainings')
  return response.data
}

export const createTraining = async (data: {
  name: string
  registrationBook?: string
  cycle?: string
  targetUsers: string[]
  hours?: string
  implementationDate?: string
  department?: string
  manager: string
  method?: string
  methodLink?: string
  deadline?: string
}): Promise<Training> => {
  const response = await apiClient.post<Training>('/trainings', data)
  return response.data
}

export const updateTraining = async (
  id: string,
  data: Partial<{
    name: string
    registrationBook?: string
    cycle?: string
    targetUsers: string[]
    hours?: string
    implementationDate?: string
    department?: string
    manager: string
    method?: string
    methodLink?: string
    deadline?: string
  }>
): Promise<Training> => {
  const response = await apiClient.put<Training>(`/trainings/${id}`, data)
  return response.data
}

export const deleteTraining = async (id: string): Promise<void> => {
  await apiClient.delete(`/trainings/${id}`)
}

