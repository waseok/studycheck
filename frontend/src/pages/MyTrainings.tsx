import { Fragment, useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getMyTrainings, updateCompletionNumber, cancelCompletion } from '../api/participants'
import { getMyMeetings, MyMeeting } from '../api/meetings'
import { TrainingParticipant } from '../types'

/** 내 연수 정렬 그룹: 1=미이수 일반연수, 2=완료 일반연수, 3=연수등록부 */
const getTrainingSortGroup = (participant: TrainingParticipant): number => {
  if (participant.training?.registrationBook) return 3
  if (participant.status !== 'completed') return 1
  return 2
}

const sortTrainingsForDisplay = (items: TrainingParticipant[]): TrainingParticipant[] => {
  return [...items].sort((a, b) => {
    const groupA = getTrainingSortGroup(a)
    const groupB = getTrainingSortGroup(b)
    if (groupA !== groupB) return groupA - groupB

    // 연수등록부 그룹 내에서는 미서명(미완료) 우선
    if (groupA === 3) {
      if (a.status !== 'completed' && b.status === 'completed') return -1
      if (a.status === 'completed' && b.status !== 'completed') return 1
    }

    const deadlineA = a.training?.deadline ? new Date(a.training.deadline).getTime() : Number.MAX_SAFE_INTEGER
    const deadlineB = b.training?.deadline ? new Date(b.training.deadline).getTime() : Number.MAX_SAFE_INTEGER
    if (deadlineA !== deadlineB) return deadlineA - deadlineB

    return (a.training?.name || '').localeCompare(b.training?.name || '', 'ko')
  })
}

const sortMeetingsForDisplay = (items: MyMeeting[]): MyMeeting[] => {
  return [...items].sort((a, b) => {
    if (!a.hasSigned && b.hasSigned) return -1
    if (a.hasSigned && !b.hasSigned) return 1
    return a.name.localeCompare(b.name, 'ko')
  })
}

const MyTrainings = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetName = searchParams.get('name')
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [myMeetings, setMyMeetings] = useState<MyMeeting[]>([])
  const [loading, setLoading] = useState(false)
  const [editingCompletionNumbers, setEditingCompletionNumbers] = useState<Record<string, string>>({})
  const [editingCompletionNames, setEditingCompletionNames] = useState<Record<string, string>>({})
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [registrationBooksOpen, setRegistrationBooksOpen] = useState(false)
  const [meetingsOpen, setMeetingsOpen] = useState(false)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

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
      const [trainingData, meetingData] = await Promise.all([
        getMyTrainings(),
        getMyMeetings()
      ])
      const sorted = sortTrainingsForDisplay(trainingData)
      setParticipants(sorted)
      setMyMeetings(sortMeetingsForDisplay(meetingData))
      // name 파라미터와 일치하는 연수 하이라이트
      if (targetName) {
        const matched = sorted.find(p => p.training?.name === targetName)
        if (matched) {
          if (matched.training?.registrationBook) setRegistrationBooksOpen(true)
          setHighlightedId(matched.id)
          setTimeout(() => {
            cardRefs.current[matched.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // 3초 후 하이라이트 제거
            setTimeout(() => setHighlightedId(null), 3000)
          }, 300)
        }
      }
    } catch (error) {
      console.error('내 연수 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCompletionNumber = async (
    participantId: string,
    completionNumber: string,
    completionName?: string
  ) => {
    try {
      await updateCompletionNumber(participantId, completionNumber, completionName)
      setEditingCompletionNumbers(prev => {
        const next = { ...prev }
        delete next[participantId]
        return next
      })
      setEditingCompletionNames(prev => {
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

  const handleCompletionNameChange = (participantId: string, value: string) => {
    setEditingCompletionNames(prev => ({
      ...prev,
      [participantId]: value
    }))
  }

  const handleSubmitCompletionNumber = (participantId: string) => {
    const numberValue = editingCompletionNumbers[participantId]?.trim()
      || participants.find(p => p.id === participantId)?.completionNumber?.trim()
    if (!numberValue) {
      alert('이수번호를 입력해주세요.')
      return
    }
    const nameValue = editingCompletionNames[participantId]?.trim()
      || participants.find(p => p.id === participantId)?.completionName?.trim()
      || undefined
    handleUpdateCompletionNumber(participantId, numberValue, nameValue)
  }

  const handleCancelCompletion = async (participantId: string) => {
    if (!confirm('제출을 취소하시겠습니까? 이수번호와 연수명이 삭제됩니다.')) return
    try {
      await cancelCompletion(participantId)
      setEditingCompletionNumbers(prev => {
        const next = { ...prev }
        delete next[participantId]
        return next
      })
      setEditingCompletionNames(prev => {
        const next = { ...prev }
        delete next[participantId]
        return next
      })
      fetchTrainings()
    } catch (error: any) {
      alert(error.response?.data?.error || '제출 취소 중 오류가 발생했습니다.')
    }
  }

  const sortedParticipants = useMemo(() => sortTrainingsForDisplay(participants), [participants])
  const sortedMeetings = useMemo(() => sortMeetingsForDisplay(myMeetings), [myMeetings])
  const firstRegistrationBookIndex = sortedParticipants.findIndex((p) => !!p.training?.registrationBook)
  const registrationBookCount = sortedParticipants.filter((p) => !!p.training?.registrationBook).length
  const unsignedRegistrationBookCount = sortedParticipants.filter(
    (p) => !!p.training?.registrationBook && p.status !== 'completed'
  ).length
  const unsignedMeetingCount = sortedMeetings.filter((m) => !m.hasSigned).length

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
          {sortedParticipants.map((participant, index) => {
            const training = participant.training
            if (!training) return null

            const hasDetail = training.description || training.method || training.methodLink || training.manager
            const descLong = isDescLong(training.description)
            const descExpanded = expandedDescriptions[participant.id] ?? false
            const isRegistrationBook = !!training.registrationBook
            const isFirstRegistrationBook = index === firstRegistrationBookIndex
            return (
              <Fragment key={participant.id}>
                {isFirstRegistrationBook && (
                  <button
                    type="button"
                    onClick={() => setRegistrationBooksOpen((open) => !open)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white border-2 border-purple-200 rounded-xl shadow-sm hover:bg-purple-50 text-left"
                    aria-expanded={registrationBooksOpen}
                  >
                    <span className="font-bold text-purple-900">
                      ✍️ 연수등록부 ({registrationBookCount}개)
                      {unsignedRegistrationBookCount > 0 && (
                        <span className="ml-2 text-xs font-bold text-red-600">
                          미서명 {unsignedRegistrationBookCount}개
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-purple-600">
                      {registrationBooksOpen ? '▲ 접어두기' : '▼ 펼쳐보기'}
                    </span>
                  </button>
                )}
                {(!isRegistrationBook || registrationBooksOpen) && (
                  <div
                    ref={el => { cardRefs.current[participant.id] = el }}
                    className={`bg-white rounded-2xl shadow border-l-4 overflow-hidden transition-all duration-500 ${participant.status !== 'completed' ? 'border-l-red-500' : 'border-l-blue-500'} ${highlightedId === participant.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                  >
                {/* 헤더 */}
                <div className="px-6 pt-5 pb-4">
                  <div className="flex justify-between items-start gap-3">
                    <h2 className="text-lg font-bold text-gray-900 leading-snug">{training.name}</h2>
                    <span className={`shrink-0 px-3 py-1 text-xs font-bold rounded ${
                      participant.status === 'completed' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {participant.status === 'completed' ? '완료' : '미완료'}
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
                        {participant.status === 'completed' ? '이수 정보 수정' : '이수 정보 입력'}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="연수명 (이수증에 적힌 연수명)"
                          value={editingCompletionNames[participant.id] ?? (participant.completionName || '')}
                          onChange={(e) => handleCompletionNameChange(participant.id, e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-400 text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="이수번호 *"
                            value={editingCompletionNumbers[participant.id] ?? (participant.completionNumber || '')}
                            onChange={(e) => handleCompletionNumberChange(participant.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitCompletionNumber(participant.id) }}
                            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-400 text-sm"
                          />
                          <button
                            onClick={() => handleSubmitCompletionNumber(participant.id)}
                            disabled={
                              !(editingCompletionNumbers[participant.id]?.trim() || participant.completionNumber)
                            }
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
                )}
              </Fragment>
            )
          })}

          {/* 회의등록부 — 맨 아래 */}
          {sortedMeetings.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setMeetingsOpen((open) => !open)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white border-2 border-green-200 rounded-xl shadow-sm hover:bg-green-50 text-left"
                aria-expanded={meetingsOpen}
              >
                <span className="font-bold text-green-900">
                  📝 회의등록부 ({sortedMeetings.length}개)
                  {unsignedMeetingCount > 0 && (
                    <span className="ml-2 text-xs font-bold text-red-600">
                      미서명 {unsignedMeetingCount}개
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold text-green-700">
                  {meetingsOpen ? '▲ 접어두기' : '▼ 펼쳐보기'}
                </span>
              </button>
              {meetingsOpen && sortedMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className={`bg-white rounded-2xl shadow border-l-4 overflow-hidden ${!meeting.hasSigned ? 'border-l-red-500' : 'border-l-blue-500'}`}
                >
                  <div className="px-6 py-5">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">회의등록부</p>
                        <h2 className="text-lg font-bold text-gray-900 leading-snug">{meeting.name}</h2>
                      </div>
                      <span className={`shrink-0 px-3 py-1 text-xs font-bold rounded ${
                        meeting.hasSigned ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {meeting.hasSigned ? '서명완료' : '미서명'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5 mb-4">
                      {meeting.date && <p>📅 {meeting.date}</p>}
                      {meeting.location && <p>📍 {meeting.location}</p>}
                    </div>
                    {meeting.hasSigned ? (
                      <div className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
                        <span>✅</span>
                        <span className="font-medium">회의등록부 서명 완료</span>
                        {meeting.signedAt && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(meeting.signedAt).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <span className="text-green-800 text-sm font-medium">회의등록부에 서명이 필요합니다</span>
                        <button
                          onClick={() => navigate(`/dashboard/meetings/${meeting.id}`)}
                          className="shrink-0 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                        >
                          서명하러 가기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {sortedParticipants.length === 0 && sortedMeetings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            참여 중인 연수가 없습니다.
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MyTrainings

