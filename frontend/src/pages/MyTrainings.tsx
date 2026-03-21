import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getMyTrainings, updateCompletionNumber, cancelCompletion } from '../api/participants'
import { TrainingParticipant } from '../types'

const MyTrainings = () => {
  const navigate = useNavigate()
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [editingCompletionNumbers, setEditingCompletionNumbers] = useState<Record<string, string>>({})
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

  const isDescLong = (desc: string | null | undefined) =>
    !!desc && (desc.length > 150 || desc.split('\n').length > 3)

  const toggleDesc = (id: string) =>
    setExpandedDescriptions(prev => ({ ...prev, [id]: !prev[id] }))

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

  const handleCancelCompletion = async (participantId: string) => {
    if (!confirm('제출을 취소하시겠습니까? 이수번호가 삭제됩니다.')) return
    try {
      await cancelCompletion(participantId)
      setEditingCompletionNumbers(prev => {
        const next = { ...prev }
        delete next[participantId]
        return next
      })
      fetchTrainings()
    } catch (error: any) {
      alert(error.response?.data?.error || '제출 취소 중 오류가 발생했습니다.')
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

            const hasDetail = training.description || training.method || training.methodLink || training.manager
            const descLong = isDescLong(training.description)
            const descExpanded = expandedDescriptions[participant.id] ?? false
            return (
              <div key={participant.id} className={`bg-white rounded-2xl shadow border-l-4 overflow-hidden ${participant.status !== 'completed' ? 'border-l-yellow-400' : 'border-l-green-400'}`}>
                {/* 헤더 */}
                <div className="px-6 pt-5 pb-4">
                  <div className="flex justify-between items-start gap-3">
                    <h2 className="text-lg font-bold text-gray-900 leading-snug">{training.name}</h2>
                    <span className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-full ${
                      participant.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {participant.status === 'completed' ? '✅ 완료' : '⏳ 미완료'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    {Array.isArray(training.targetUsers) && training.targetUsers.length > 0 && (
                      <span>대상: {training.targetUsers.join(', ')}</span>
                    )}
                    {training.deadline && (
                      <span className={`font-semibold ${participant.status !== 'completed' ? 'text-red-600' : 'text-gray-500'}`}>
                        이수 기한: {new Date(training.deadline).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* 세부 정보 */}
                {hasDetail && (
                  <div className="mx-6 mb-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-1.5 text-sm text-gray-700">
                    {training.description && (
                      <div>
                        <p className={`whitespace-pre-line leading-relaxed ${descLong && !descExpanded ? 'line-clamp-3' : ''}`}>
                          {training.description}
                        </p>
                        {descLong && (
                          <button
                            onClick={() => toggleDesc(participant.id)}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {descExpanded ? '▲ 접기' : '▼ 더 보기'}
                          </button>
                        )}
                      </div>
                    )}
                    {(training.method || training.methodLink) && (
                      <p className="text-gray-500">
                        <span className="font-medium text-gray-600">📎 연수자료</span>
                        {training.method && <span className="ml-1">{training.method}</span>}
                        {training.methodLink && (
                          <a href={training.methodLink} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline break-all">{training.methodLink}</a>
                        )}
                      </p>
                    )}
                    {training.manager && (
                      <p className="text-gray-500"><span className="font-medium text-gray-600">👤 담당자</span> {training.manager}</p>
                    )}
                  </div>
                )}

                {/* 이수 액션 */}
                <div className="px-6 pb-5">
                  {training.registrationBook ? (
                    participant.status === 'completed' ? (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <span className="text-base">✅</span>
                        <span className="font-medium text-sm">연수등록부 서명 완료</span>
                        {participant.completedAt && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(participant.completedAt).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 text-yellow-700 text-sm">
                          <span>✍️</span>
                          <span className="font-medium">연수등록부에 서명하면 이수 완료됩니다</span>
                        </div>
                        <button
                          onClick={() => navigate(`/dashboard/signature-book/${training.id}`)}
                          className="shrink-0 px-4 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600"
                        >
                          서명하러 가기
                        </button>
                      </div>
                    )
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        {participant.status === 'completed' ? '이수번호 수정' : '이수번호 입력'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="이수번호를 입력하세요"
                          value={editingCompletionNumbers[participant.id] ?? (participant.completionNumber || '')}
                          onChange={(e) => handleCompletionNumberChange(participant.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitCompletionNumber(participant.id) }}
                          className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-400 text-sm"
                        />
                        <button
                          onClick={() => handleSubmitCompletionNumber(participant.id)}
                          disabled={!editingCompletionNumbers[participant.id]?.trim() && !participant.completionNumber}
                          className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {participant.status === 'completed' ? '수정' : '제출'}
                        </button>
                        {participant.status === 'completed' && (
                          <button
                            onClick={() => handleCancelCompletion(participant.id)}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium"
                          >
                            취소
                          </button>
                        )}
                      </div>
                      {participant.status === 'completed' && participant.completedAt && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          완료일: {new Date(participant.completedAt).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
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

