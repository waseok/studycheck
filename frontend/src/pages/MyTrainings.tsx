import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getMyTrainings, updateCompletionNumber } from '../api/participants'
import { TrainingParticipant } from '../types'

const MyTrainings = () => {
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    setLoading(true)
    try {
      const data = await getMyTrainings()
      setParticipants(data)
    } catch (error) {
      console.error('내 연수 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCompletionNumber = async (participantId: string, completionNumber: string) => {
    try {
      await updateCompletionNumber(participantId, completionNumber)
      fetchTrainings()
    } catch (error: any) {
      alert(error.response?.data?.error || '이수번호 입력 중 오류가 발생했습니다.')
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
        <h1 className="text-3xl font-bold text-gray-900">내 연수</h1>

        <div className="space-y-4">
          {participants.map((participant) => {
            const training = participant.training
            if (!training) return null

            return (
              <div key={participant.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{training.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      대상자: {Array.isArray(training.targetUsers) ? training.targetUsers.join(', ') : '-'}
                    </p>
                    {training.deadline && (
                      <p className="text-sm text-gray-500">
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

                {participant.status !== 'completed' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이수번호 입력
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="이수번호를 입력하세요"
                        defaultValue={participant.completionNumber || ''}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            handleUpdateCompletionNumber(participant.id, e.target.value.trim())
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleUpdateCompletionNumber(participant.id, e.currentTarget.value.trim())
                            e.currentTarget.blur()
                          }
                        }}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {participant.status === 'completed' && participant.completionNumber && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      이수번호: <span className="font-medium">{participant.completionNumber}</span>
                    </p>
                    {participant.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        완료일: {new Date(participant.completedAt).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                )}
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

