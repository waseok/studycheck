import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getMyTrainings, updateCompletionNumber } from '../api/participants'
import { TrainingParticipant } from '../types'

const MyTrainings = () => {
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [editingCompletionNumbers, setEditingCompletionNumbers] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    setLoading(true)
    try {
      const data = await getMyTrainings()
      // 미완료 연수를 위로 정렬
      const sorted = [...data].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1
        if (a.status !== 'completed' && b.status === 'completed') return -1
        return 0
      })
      setParticipants(sorted)
    } catch (error) {
      console.error('내 연수 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCompletionNumber = async (participantId: string, completionNumber: string) => {
    try {
      await updateCompletionNumber(participantId, completionNumber)
      // 편집 중인 값 제거
      setEditingCompletionNumbers(prev => {
        const next = { ...prev }
        delete next[participantId]
        return next
      })
      fetchTrainings()
    } catch (error: any) {
      alert(error.response?.data?.error || '이수번호 입력 중 오류가 발생했습니다.')
    }
  }

  const handleCompletionNumberChange = (participantId: string, value: string) => {
    setEditingCompletionNumbers(prev => ({
      ...prev,
      [participantId]: value
    }))
  }

  const handleSubmitCompletionNumber = (participantId: string) => {
    const value = editingCompletionNumbers[participantId]?.trim()
    if (value) {
      handleUpdateCompletionNumber(participantId, value)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-blue-800 mb-6">📚 내 연수</h1>

        <div className="space-y-4">
          {participants.map((participant) => {
            const training = participant.training
            if (!training) return null

            return (
              <div key={participant.id} className={`bg-white shadow-lg rounded-2xl p-6 border-2 ${participant.status !== 'completed' ? 'border-yellow-300' : 'border-green-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{training.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      대상자: {Array.isArray(training.targetUsers) ? training.targetUsers.join(', ') : '-'}
                    </p>
                    {training.deadline && (
                      <p className={`text-base font-semibold mt-2 ${participant.status !== 'completed' ? 'text-red-600' : 'text-gray-600'}`}>
                        이수 기한: {new Date(training.deadline).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      participant.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {participant.status === 'completed' ? '완료' : '미완료'}
                  </span>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {participant.status === 'completed' ? '이수번호 수정' : '이수번호 입력'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="이수번호를 입력하세요"
                      value={editingCompletionNumbers[participant.id] ?? (participant.completionNumber || '')}
                      onChange={(e) => handleCompletionNumberChange(participant.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitCompletionNumber(participant.id)
                        }
                      }}
                      className="flex-1 border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-base"
                    />
                    <button
                      onClick={() => handleSubmitCompletionNumber(participant.id)}
                      disabled={!editingCompletionNumbers[participant.id]?.trim() && !participant.completionNumber}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-md transition-colors"
                    >
                      {participant.status === 'completed' ? '수정' : '제출'}
                    </button>
                  </div>
                  {participant.status === 'completed' && participant.completedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      완료일: {new Date(participant.completedAt).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {participants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            참여 중인 연수가 없습니다.
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MyTrainings

