import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import { getTrainingStats, getIncompleteList } from '../api/stats'
import { getTrainings } from '../api/trainings'
import { sendIncompleteReminders, sendReminders } from '../api/reminders'
import { Training } from '../types'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const Stats = () => {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null)
  const [trainingStats, setTrainingStats] = useState<any>(null)
  const [incompleteList, setIncompleteList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [reminderResult, setReminderResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  useEffect(() => {
    fetchTrainings()
    fetchIncompleteList()
  }, [])

  const fetchTrainings = async () => {
    setLoading(true)
    try {
      const data = await getTrainings()
      setTrainings(data)
    } catch (error) {
      console.error('연수 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainingStats = async (trainingId: string) => {
    try {
      const stats = await getTrainingStats(trainingId)
      setTrainingStats(stats)
    } catch (error) {
      console.error('연수 통계 조회 오류:', error)
    }
  }

  const fetchIncompleteList = async () => {
    try {
      const data = await getIncompleteList()
      setIncompleteList(data)
    } catch (error) {
      console.error('미이수자 목록 조회 오류:', error)
    }
  }

  useEffect(() => {
    if (selectedTraining) {
      fetchTrainingStats(selectedTraining)
    }
  }, [selectedTraining])

  const handleSendReminder = async (trainingId: string, trainingName: string) => {
    if (!confirm(`"${trainingName}" 미이수자에게 알림 메일을 발송하시겠습니까?`)) return

    setSendingReminder(trainingId)
    setReminderResult(null)
    try {
      const result = await sendIncompleteReminders(trainingId)
      setReminderResult({
        type: 'success',
        message: result.message || `${result.sentCount}명에게 발송 완료 (실패: ${result.failedCount}명)`
      })
    } catch (error: any) {
      const msg = error.code === 'ECONNABORTED'
        ? '요청 시간이 초과되었습니다. 서버가 응답하지 않습니다.'
        : error.response?.data?.error || '알림 발송에 실패했습니다. SMTP 설정을 확인해주세요.'
      setReminderResult({ type: 'error', message: msg })
    } finally {
      setSendingReminder(null)
    }
  }

  const handleExportIncompleteToExcel = () => {
    if (incompleteList.length === 0) {
      alert('미이수자가 없습니다.')
      return
    }
    const excelData = incompleteList.map((item, index) => ({
      '순번': index + 1,
      '연수명': item.training?.name || '-',
      '이수 기한': item.training?.deadline ? new Date(item.training.deadline).toLocaleDateString('ko-KR') : '-',
      '이름': item.user?.name || '-',
      '이메일': item.user?.email || '-',
      '유형': item.user?.userType || '-',
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, '미이수자 목록')
    XLSX.writeFile(wb, `미이수자_목록_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleSendAllReminders = async () => {
    if (!confirm('모든 연수의 미이수자에게 알림 메일을 발송하시겠습니까?')) return

    setSendingReminder('all')
    setReminderResult(null)
    try {
      const result = await sendReminders()
      setReminderResult({ type: 'success', message: result.message })
    } catch (error: any) {
      const msg = error.code === 'ECONNABORTED'
        ? '요청 시간이 초과되었습니다. 서버가 응답하지 않습니다.'
        : error.response?.data?.error || '알림 발송에 실패했습니다. SMTP 설정을 확인해주세요.'
      setReminderResult({ type: 'error', message: msg })
    } finally {
      setSendingReminder(null)
    }
  }

  // 각 연수별 완료율 데이터 (원그래프용)
  const trainingPieData = trainings.map(training => {
    const total = training.participants?.length || 0
    const completed = training.participants?.filter((p: any) => p.status === 'completed').length || 0
    const pending = total - completed
    const completionRate = total > 0 ? (completed / total) * 100 : 0
    
    return {
      id: training.id,
      name: training.name.length > 15 ? training.name.substring(0, 15) + '...' : training.name,
      fullName: training.name,
      total,
      completed,
      pending,
      completionRate,
      pieData: [
        { name: '완료', value: completed },
        { name: '미완료', value: pending }
      ]
    }
  })

  const pieData = trainingStats ? [
    { name: '완료', value: trainingStats.completed },
    { name: '미완료', value: trainingStats.pending }
  ] : []

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-blue-800 mb-6">📊 통계</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow-xl rounded-2xl p-6 border-4 border-blue-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">연수별 이수 현황</h2>
            <div className="space-y-6 max-h-[500px] overflow-y-auto">
              {trainingPieData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">등록된 연수가 없습니다.</div>
              ) : (
                trainingPieData.map((training) => (
                  <div key={training.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{training.fullName}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <ResponsiveContainer width={120} height={120}>
                          <PieChart>
                            <Pie
                              data={training.pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                              outerRadius={50}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {training.pieData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : '#FF8042'} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <span>완료: {training.completed}명</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                            <span>미완료: {training.pending}명</span>
                          </div>
                          <div className="pt-2">
                            <span className="font-semibold text-blue-600">이수율: {training.completionRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-6 border-4 border-blue-300">
            <h2 className="text-xl font-semibold mb-4">연수 선택</h2>
            <select
              value={selectedTraining || ''}
              onChange={(e) => setSelectedTraining(e.target.value || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
            >
              <option value="">연수를 선택하세요</option>
              {trainings.map((training) => (
                <option key={training.id} value={training.id}>
                  {training.name}
                </option>
              ))}
            </select>

            {trainingStats && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">이수 현황</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <div className="text-2xl font-bold">{trainingStats.total}</div>
                      <div className="text-sm text-gray-500">전체</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{trainingStats.completed}</div>
                      <div className="text-sm text-gray-500">완료</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{trainingStats.pending}</div>
                      <div className="text-sm text-gray-500">미완료</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {trainingStats.completionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">완료율</div>
                    </div>
                  </div>

                  {trainingStats.pending > 0 && selectedTraining && (
                    <button
                      onClick={() => handleSendReminder(selectedTraining, trainingStats.training?.name || '')}
                      disabled={sendingReminder === selectedTraining}
                      className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {sendingReminder === selectedTraining ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          발송 중...
                        </>
                      ) : (
                        <>📧 미이수자 {trainingStats.pending}명에게 알림 메일 발송</>
                      )}
                    </button>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {reminderResult && (
          <div className={`p-4 rounded-xl text-sm font-medium ${
            reminderResult.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {reminderResult.type === 'success' ? '✅' : '❌'} {reminderResult.message}
            <button onClick={() => setReminderResult(null)} className="ml-3 text-xs underline opacity-70 hover:opacity-100">닫기</button>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-2xl p-6 border-4 border-blue-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">미이수자 목록</h2>
            <div className="flex gap-2">
              {incompleteList.length > 0 && (
                <button
                  onClick={handleExportIncompleteToExcel}
                  className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  엑셀 다운로드
                </button>
              )}
              {incompleteList.length > 0 && (
                <button
                  onClick={handleSendAllReminders}
                  disabled={sendingReminder === 'all'}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {sendingReminder === 'all' ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      발송 중...
                    </>
                  ) : (
                    <>📧 전체 미이수자에게 알림 발송</>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연수명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이수 기한
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incompleteList.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.training?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user?.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user?.userType || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.training?.deadline
                        ? new Date(item.training.deadline).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {incompleteList.length === 0 && (
            <div className="text-center py-8 text-gray-500">미이수자가 없습니다.</div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Stats

