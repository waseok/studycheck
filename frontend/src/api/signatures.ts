import apiClient from './client'

export interface SignatureInfo {
  id: string
  signatureImage: string
  signedAt: string
}

export interface SignatureParticipant {
  participantId: string
  userId: string
  name: string
  userType: string
  position: string | null
  grade: string | null
  class: string | null
  signature: SignatureInfo | null
}

export interface SignatureBookData {
  training: {
    id: string
    name: string
    department: string | null
    manager: string
    implementationDate: string | null
    hours: string | null
  }
  participants: SignatureParticipant[]
}

export const getSignatureBook = async (trainingId: string): Promise<SignatureBookData> => {
  const response = await apiClient.get<SignatureBookData>(`/signatures/training/${trainingId}`)
  return response.data
}

export const saveSignature = async (trainingId: string, signatureImage: string): Promise<{ success: boolean }> => {
  const response = await apiClient.post(`/signatures/training/${trainingId}`, { signatureImage })
  return response.data
}

export const deleteSignature = async (trainingId: string, userId: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete(`/signatures/training/${trainingId}/user/${userId}`)
  return response.data
}
