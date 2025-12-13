import apiClient from './client'

// 수동으로 리마인더 발송
export const sendReminders = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>('/reminders/send')
  return response.data
}

// 특정 연수의 미이수자에게 알림 발송
export const sendIncompleteReminders = async (trainingId: string): Promise<{ success: boolean; message: string; sentCount: number; failedCount: number; total: number }> => {
  const response = await apiClient.post<{ success: boolean; message: string; sentCount: number; failedCount: number; total: number }>(`/reminders/send-incomplete/${trainingId}`)
  return response.data
}

// 이메일 테스트 발송
export const testEmail = async (email: string): Promise<{ success: boolean; message?: string; error?: string; details?: string }> => {
  const response = await apiClient.post<{ success: boolean; message?: string; error?: string; details?: string }>('/reminders/test-email', { email })
  return response.data
}

