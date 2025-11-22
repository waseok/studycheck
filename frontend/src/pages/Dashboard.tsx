import { useState } from 'react'
import Layout from '../components/Layout'
import { isAdmin } from '../api/auth'
import { testEmail, sendReminders } from '../api/reminders'

const Dashboard = () => {
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [testEmailLoading, setTestEmailLoading] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [reminderResult, setReminderResult] = useState<{ success: boolean; message?: string } | null>(null)

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmailAddress.trim()) {
      setTestEmailResult({ success: false, error: '이메일 주소를 입력해주세요.' })
      return
    }

    setTestEmailLoading(true)
    setTestEmailResult(null)
    try {
      const result = await testEmail(testEmailAddress.trim())
      setTestEmailResult(result)
      if (result.success) {
        setTestEmailAddress('')
      }
    } catch (error: any) {
      setTestEmailResult({
        success: false,
        error: error.response?.data?.error || '이메일 테스트 중 오류가 발생했습니다.'
      })
    } finally {
      setTestEmailLoading(false)
    }
  }

  const handleSendReminders = async () => {
    if (!confirm('리마인더를 수동으로 발송하시겠습니까?')) {
      return
    }

    setReminderLoading(true)
    setReminderResult(null)
    try {
      const result = await sendReminders()
      setReminderResult(result)
    } catch (error: any) {
      setReminderResult({
        success: false,
        message: error.response?.data?.error || '리마인더 발송 중 오류가 발생했습니다.'
      })
    } finally {
      setReminderLoading(false)
    }
  }

  const adminUser = isAdmin()

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-2 text-gray-600">의무연수 안내 취합 통합 플랫폼에 오신 것을 환영합니다.</p>
        </div>

        {adminUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 이메일 테스트 카드 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">이메일 설정 테스트</h2>
              <p className="text-sm text-gray-600 mb-4">
                SMTP 설정이 올바른지 확인하기 위해 테스트 이메일을 발송할 수 있습니다.
              </p>
              
              <form onSubmit={handleTestEmail} className="space-y-4">
                <div>
                  <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-2">
                    테스트 이메일 주소
                  </label>
                  <input
                    id="test-email"
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="test@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={testEmailLoading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={testEmailLoading || !testEmailAddress.trim()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {testEmailLoading ? '발송 중...' : '테스트 이메일 발송'}
                </button>
              </form>

              {testEmailResult && (
                <div className={`mt-4 p-3 rounded-md ${
                  testEmailResult.success 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <p className="text-sm font-medium">
                    {testEmailResult.success ? '✓ 성공' : '✗ 실패'}
                  </p>
                  <p className="text-sm mt-1">
                    {testEmailResult.message || testEmailResult.error}
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>참고:</strong> 이메일을 받지 못했다면 <code className="bg-blue-100 px-1 rounded">backend/.env</code> 파일의 SMTP 설정을 확인해주세요.
                </p>
              </div>
            </div>

            {/* 리마인더 수동 발송 카드 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">리마인더 수동 발송</h2>
              <p className="text-sm text-gray-600 mb-4">
                스케줄러를 기다리지 않고 즉시 리마인더를 발송할 수 있습니다.
              </p>
              
              <button
                onClick={handleSendReminders}
                disabled={reminderLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {reminderLoading ? '발송 중...' : '리마인더 발송'}
              </button>

              {reminderResult && (
                <div className={`mt-4 p-3 rounded-md ${
                  reminderResult.success 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <p className="text-sm">
                    {reminderResult.message || '리마인더 발송이 완료되었습니다.'}
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong>참고:</strong> 일반적으로 리마인더는 매일 오전 9시에 자동으로 발송됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
