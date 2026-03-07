import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import { isAdmin, getRole } from '../api/auth'
import { getParticipants, updateCompletionNumber, cancelCompletion } from '../api/participants'
import { getTrainings } from '../api/trainings'
import { sendIncompleteReminders } from '../api/reminders'
import { TrainingParticipant, Training } from '../types'

const TrainingCollection = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [training, setTraining] = useState<Training | null>(null)
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [filteredParticipants, setFilteredParticipants] = useState<TrainingParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sortBy, setSortBy] = useState<'default' | 'incomplete'>('default')
  const [filterIncomplete, setFilterIncomplete] = useState(false)
  const [showCompletionHelp, setShowCompletionHelp] = useState(false)
  const role = getRole()
  const adminUser = isAdmin() || role === 'TRAINING_ADMIN'

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  useEffect(() => {
    // 정렬 및 필터링 적용
    let filtered = [...participants]

    // 미이수자만 필터링
    if (filterIncomplete) {
      filtered = filtered.filter(p => p.status !== 'completed' || !p.completionNumber)
    }

    // 정렬: 관리자 우선, 그 다음 학년-반 순서
    if (sortBy === 'default') {
      filtered.sort((a, b) => {
        // 관리자 우선 (role이 SUPER_ADMIN 또는 TRAINING_ADMIN인 경우)
        const aIsAdmin = a.user?.role === 'SUPER_ADMIN' || a.user?.role === 'TRAINING_ADMIN'
        const bIsAdmin = b.user?.role === 'SUPER_ADMIN' || b.user?.role === 'TRAINING_ADMIN'
        
        if (aIsAdmin && !bIsAdmin) return -1
        if (!aIsAdmin && bIsAdmin) return 1

        // 학년 순서 (숫자로 변환 후 비교)
        const aGrade = parseInt(a.user?.grade || '0') || 0
        const bGrade = parseInt(b.user?.grade || '0') || 0
        if (aGrade !== bGrade) return aGrade - bGrade

        // 반 순서
        const aClass = parseInt(a.user?.class || '0') || 0
        const bClass = parseInt(b.user?.class || '0') || 0
        if (aClass !== bClass) return aClass - bClass

        // 이름 순서
        return (a.user?.name || '').localeCompare(b.user?.name || '')
      })
    } else if (sortBy === 'incomplete') {
      // 미이수자 우선 정렬
      filtered.sort((a, b) => {
        const aIncomplete = a.status !== 'completed' || !a.completionNumber
        const bIncomplete = b.status !== 'completed' || !b.completionNumber
        
        if (aIncomplete && !bIncomplete) return -1
        if (!aIncomplete && bIncomplete) return 1

        // 학년-반 순서
        const aGrade = parseInt(a.user?.grade || '0') || 0
        const bGrade = parseInt(b.user?.grade || '0') || 0
        if (aGrade !== bGrade) return aGrade - bGrade

        const aClass = parseInt(a.user?.class || '0') || 0
        const bClass = parseInt(b.user?.class || '0') || 0
        if (aClass !== bClass) return aClass - bClass

        return (a.user?.name || '').localeCompare(b.user?.name || '')
      })
    }

    setFilteredParticipants(filtered)
  }, [participants, sortBy, filterIncomplete])

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      console.log('🔄 데이터 로드 시작:', { trainingId: id })
      const trainings = await getTrainings()
      const foundTraining = trainings.find(t => t.id === id)
      if (foundTraining) {
        console.log('✅ 연수 정보 찾음:', foundTraining.name)
        setTraining(foundTraining)
      } else {
        console.warn('⚠️ 연수 정보를 찾을 수 없음:', id)
      }
      
      const data = await getParticipants(id)
      console.log('📊 참여자 데이터 로드 완료:', {
        trainingId: id,
        participantCount: data?.length || 0,
        isArray: Array.isArray(data),
        participants: data || []
      })
      
      // 데이터가 배열인지 확인
      if (Array.isArray(data)) {
        setParticipants(data)
      } else {
        console.error('❌ API 응답이 배열이 아닙니다:', data)
        setParticipants([])
      }
    } catch (error: any) {
      console.error('❌ 데이터 조회 오류:', {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      })
      setParticipants([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCompletionNumber = async (participantId: string, completionNumber: string) => {
    try {
      await updateCompletionNumber(participantId, completionNumber)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || '이수번호 입력 중 오류가 발생했습니다.')
    }
  }

  const handleCancelCompletion = async (participantId: string) => {
    if (!confirm('이 참여자의 제출을 취소하시겠습니까? 이수번호가 삭제됩니다.')) return
    try {
      await cancelCompletion(participantId)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || '제출 취소 중 오류가 발생했습니다.')
    }
  }

  const handleSendIncompleteReminders = async () => {
    if (!id) return
    
    if (!confirm('미이수자에게 알림 메일을 발송하시겠습니까?')) return

    setSending(true)
    try {
      const result = await sendIncompleteReminders(id)
      alert(result.message)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || '알림 발송 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  const completedCount = participants.filter(p => p.status === 'completed').length
  const totalCount = participants.length
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const incompleteCount = participants.filter(p => p.status !== 'completed' || !p.completionNumber).length

  // 디버깅: 통계 값 확인
  useEffect(() => {
    if (participants.length > 0) {
      console.log('📈 참여자 통계:', {
        totalCount,
        completedCount,
        incompleteCount,
        completionRate: completionRate.toFixed(1) + '%',
        participants: participants.map(p => ({
          id: p.id,
          name: p.user?.name,
          status: p.status,
          completionNumber: p.completionNumber
        }))
      })
    }
  }, [participants, totalCount, completedCount, incompleteCount, completionRate])

  // 엑셀 내보내기 함수
  const handleExportToExcel = () => {
    if (!training || filteredParticipants.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }

    // 엑셀 데이터 준비
    const excelData = filteredParticipants.map((participant, index) => ({
      '순번': index + 1,
      '직위': participant.user?.position || '-',
      '학년': participant.user?.grade || '-',
      '반': participant.user?.class || '-',
      '성함': participant.user?.name || '-',
      '이수번호': participant.completionNumber || '-',
      '상태': participant.status === 'completed' ? '완료' : '미완료',
      '이메일': participant.user?.email || '-',
    }))

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    
    // 통계 정보 시트
    const statsData = [
      ['연수명', training.name],
      ['이수 기한', training.deadline ? new Date(training.deadline).toLocaleDateString('ko-KR') : '미설정'],
      [''],
      ['통계 정보'],
      ['전체 참여자', totalCount],
      ['이수 완료', completedCount],
      ['미완료', incompleteCount],
      ['완료율', `${completionRate.toFixed(1)}%`],
      [''],
      ['내보낸 날짜', new Date().toLocaleString('ko-KR')]
    ]
    const statsWs = XLSX.utils.aoa_to_sheet(statsData)
    XLSX.utils.book_append_sheet(wb, statsWs, '통계')

    // 참여자 목록 시트
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, '참여자 목록')

    // 파일명 생성 (연수명_날짜.xlsx)
    const fileName = `${training.name}_${new Date().toISOString().split('T')[0]}.xlsx`
      .replace(/[<>:"/\\|?*]/g, '_')

    // 엑셀 파일 다운로드
    XLSX.writeFile(wb, fileName)
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {training?.name || '연수 취합'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              이수 기한: {training?.deadline
                ? new Date(training.deadline).toLocaleDateString('ko-KR')
                : '미설정'}
            </p>
          </div>
          <div className="flex gap-2">
            {adminUser && incompleteCount > 0 && (
              <button
                onClick={handleSendIncompleteReminders}
                disabled={sending}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? '발송 중...' : '📧 미이수자 알림 발송'}
              </button>
            )}
            <button
              onClick={handleExportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              disabled={filteredParticipants.length === 0}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              엑셀 내보내기
            </button>
            <button
              onClick={() => navigate('/dashboard/trainings')}
              className="px-4 py-2 border-2 border-gray-400 rounded-md text-gray-700 hover:bg-gray-50"
            >
              목록으로
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
              <div className="text-sm text-gray-500">전체 참여자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-gray-500">이수 완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">완료율</div>
            </div>
          </div>

          {/* 필터 및 정렬 */}
          {adminUser && (
            <div className="mb-4 flex gap-4 items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filterIncomplete}
                  onChange={(e) => setFilterIncomplete(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-2 border-gray-400 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">미이수자만 보기</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('default')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    sortBy === 'default'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  기본 정렬
                </button>
                <button
                  onClick={() => setSortBy('incomplete')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    sortBy === 'incomplete'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  미이수자 우선
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순번
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학년
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    반
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    성함
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      이수번호
                      <button
                        type="button"
                        onClick={() => setShowCompletionHelp(!showCompletionHelp)}
                        className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold hover:bg-blue-200 flex items-center justify-center flex-shrink-0"
                        title="이수번호 안내"
                      >
                        ?
                      </button>
                    </div>
                    {showCompletionHelp && (
                      <div className="absolute z-10 mt-1 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-lg text-xs text-gray-700 normal-case font-normal w-64">
                        <p className="font-bold text-yellow-800 mb-1">📋 이수번호 찾는 방법</p>
                        <p>1. 연수 플랫폼(나이스, 티처빌 등)에 로그인</p>
                        <p>2. "나의 학습방" 또는 "학습이력" 메뉴로 이동</p>
                        <p>3. 해당 연수의 이수증에서 <strong>이수번호</strong>를 확인</p>
                        <p className="mt-1 text-yellow-700">* 이수증 발급 후 번호를 입력해주세요</p>
                      </div>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  {adminUser && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      수정
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.map((participant, index) => (
                  <ParticipantRow
                    key={participant.id}
                    index={index}
                    participant={participant}
                    onUpdate={handleUpdateCompletionNumber}
                    onCancel={handleCancelCompletion}
                    isAdmin={adminUser}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

interface ParticipantRowProps {
  index: number
  participant: TrainingParticipant
  onUpdate: (id: string, completionNumber: string) => void
  onCancel: (id: string) => void
  isAdmin: boolean
}

const ParticipantRow = ({ index, participant, onUpdate, onCancel, isAdmin }: ParticipantRowProps) => {
  const [editing, setEditing] = useState(false)
  const [completionNumber, setCompletionNumber] = useState(participant.completionNumber || '')

  const handleSubmit = () => {
    if (completionNumber.trim()) {
      onUpdate(participant.id, completionNumber.trim())
      setEditing(false)
    }
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {index + 1}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {participant.user?.position || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {participant.user?.grade || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {participant.user?.class || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {participant.user?.name || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {editing ? (
          <input
            type="text"
            value={completionNumber}
            onChange={(e) => setCompletionNumber(e.target.value)}
            className="border-2 border-gray-400 rounded px-2 py-1 text-sm w-full"
            autoFocus
            onBlur={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit()
              }
            }}
          />
        ) : (
          participant.completionNumber || '-'
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            participant.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {participant.status === 'completed' ? '완료' : '미완료'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {participant.user?.email || '-'}
      </td>
      {isAdmin && (
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            {editing ? '저장' : '수정'}
          </button>
          {participant.status === 'completed' && (
            <button
              onClick={() => onCancel(participant.id)}
              className="text-red-600 hover:text-red-900"
            >
              취소
            </button>
          )}
        </td>
      )}
    </tr>
  )
}

export default TrainingCollection
