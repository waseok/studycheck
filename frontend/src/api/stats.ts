import apiClient from './client'

export const getTrainingStats = async (trainingId: string) => {
  const response = await apiClient.get(`/stats/training/${trainingId}`)
  return response.data
}

export const getUserStats = async (userId: string) => {
  const response = await apiClient.get(`/stats/user/${userId}`)
  return response.data
}

export const getIncompleteList = async (trainingId?: string) => {
  const params = trainingId ? { trainingId } : {}
  const response = await apiClient.get('/stats/incomplete', { params })
  return response.data
}

