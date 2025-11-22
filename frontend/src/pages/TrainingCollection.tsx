import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import { isAdmin } from '../api/auth'
import { getParticipants, updateCompletionNumber } from '../api/participants'
import { getTrainings } from '../api/trainings'
import { TrainingParticipant, Training } from '../types'

const TrainingCollection = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [training, setTraining] = useState<Training | null>(null)
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const trainings = await getTrainings()
      const foundTraining = trainings.find(t => t.id === id)
      if (foundTraining) {
        setTraining(foundTraining)
      }
      const data = await getParticipants(id)
      setParticipants(data)
    } catch (error) {
      console.error('데이터 조회 오류:', error)
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

  const completedCount = participants.filter(p => p.status === 'completed').length
  const totalCount = participants.length
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // 엑셀 내보내기 함수
  const handleExportToExcel = () => {
    if (!training || participants.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }

    // 엑셀 데이터 준비
    const excelData = participants.map((participant, index) => ({
      '번호': index + 1,
      '이름': participant.user?.name || '-',
      '이메일': participant.user?.email || '-',
      '유형': participant.user?.userType || '-',
      '이수번호': participant.completionNumber || '-',
      '상태': participant.status === 'completed' ? '완료' : '미완료',
      '완료일': participant.completedAt 
        ? new Date(participant.completedAt).toLocaleDateString('ko-KR') 
        : '-'
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
      ['미완료', totalCount - completedCount],
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
      .replace(/[<>:"/\\|?*]/g, '_') // 파일명에 사용할 수 없는 문자 제거

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
            <button
              onClick={handleExportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              disabled={participants.length === 0}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              엑셀 내보내기
            </button>
            <button
              onClick={() => navigate('/dashboard/trainings')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    이수번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    onUpdate={handleUpdateCompletionNumber}
                    isAdmin={isAdmin()}
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
  participant: TrainingParticipant
  onUpdate: (id: string, completionNumber: string) => void
  isAdmin: boolean
}

const ParticipantRow = ({ participant, onUpdate, isAdmin }: ParticipantRowProps) => {
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
        {participant.user?.name || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {participant.user?.email || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {participant.user?.userType || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {editing ? (
          <input
            type="text"
            value={completionNumber}
            onChange={(e) => setCompletionNumber(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
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
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {isAdmin && (
          <button
            onClick={() => setEditing(!editing)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            {editing ? '저장' : '수정'}
          </button>
        )}
      </td>
    </tr>
  )
}

export default TrainingCollection

