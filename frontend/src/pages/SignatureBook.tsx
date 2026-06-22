import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import apiClient from '../api/client'

interface Training {
  id: string
  name: string
  department: string | null
  manager: string
  implementationDate: string | null
  deadline: string | null
  isCompleted: boolean
  targetUsers: string[]
  registrationBook: string | null
  participants: { id: string; status: string }[]
}

const SignatureBook = () => {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedOpen, setCompletedOpen] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)
  const navigate = useNavigate()

  const role = localStorage.getItem('role') as string | null
  const isTrainingAdmin = role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN'

  const fetchTrainings = async () => {
    try {
      const response = await apiClient.get<Training[]>('/trainings')
      setTrainings(response.data.filter(t => t.registrationBook))
    } catch {
      setError('연수 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrainings()
  }, [])

  const handleComplete = async (training: Training, completed: boolean) => {
    const msg = completed ? '이 연수를 취합완료 처리하시겠습니까?' : '완료를 취소하시겠습니까?'
    if (!confirm(msg)) return
    setCompleting(training.id)
    try {
      await apiClient.patch(`/trainings/${training.id}/complete`, { isCompleted: completed })
      await fetchTrainings()
    } catch (error: any) {
      alert(error.response?.data?.error || '처리 중 오류가 발생했습니다.')
    } finally {
      setCompleting(null)
    }
  }

  const activeTrainings = trainings.filter(t => !t.isCompleted)
  const completedTrainings = trainings.filter(t => t.isCompleted)

  const TrainingCard = ({ t }: { t: Training }) => (
    <div
      key={t.id}
      onClick={() => navigate(`/dashboard/signature-book/${t.id}`)}
      className={`bg-white rounded-xl border-2 shadow hover:shadow-md cursor-pointer p-5 transition-all relative ${
        t.isCompleted
          ? 'border-gray-200 hover:border-gray-300 opacity-75'
          : 'border-blue-100 hover:border-blue-300'
      }`}
    >
      {isTrainingAdmin && (
        <div className="absolute top-3 right-3">
          {t.isCompleted ? (
            <button
              onClick={e => { e.stopPropagation(); handleComplete(t, false) }}
              className="group flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="완료 취소"
              disabled={completing === t.id}
            >
              <span className="text-sm leading-none">{completing === t.id ? '⏳' : '↩'}</span>
              <span className="text-[10px] leading-tight text-gray-500 group-hover:text-blue-600 whitespace-nowrap">
                {completing === t.id ? '처리중' : '완료취소'}
              </span>
            </button>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); handleComplete(t, true) }}
              className="group flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-teal-50 transition-colors disabled:opacity-50"
              title="취합 완료 처리"
              disabled={completing === t.id}
            >
              <span className="text-sm leading-none">{completing === t.id ? '⏳' : '✅'}</span>
              <span className="text-[10px] leading-tight text-gray-500 group-hover:text-teal-600 font-medium whitespace-nowrap">
                {completing === t.id ? '처리중' : '취합완료'}
              </span>
            </button>
          )}
        </div>
      )}
      <h2 className="font-bold text-gray-900 text-lg mb-2 leading-tight pr-16">{t.name}</h2>
      <div className="text-sm text-gray-600 space-y-1">
        {t.department && <p>🏢 {t.department}</p>}
        <p>👤 담당: {t.manager}</p>
        {t.implementationDate && <p>📅 {t.implementationDate}</p>}
        <p className={t.isCompleted ? 'text-gray-500 font-medium' : 'text-blue-600 font-medium'}>
          {(() => {
            const total = t.participants?.length ?? 0
            const signed = t.participants?.filter(p => p.status === 'completed').length ?? 0
            return signed > 0 ? `서명 ${signed}/${total}명` : `참여자 ${total}명`
          })()}
        </p>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className={`text-sm font-semibold ${t.isCompleted ? 'text-gray-500' : 'text-blue-600'}`}>
          {t.isCompleted ? '✅ 완료된 연수 · 등록부 보기 →' : '등록부 보기 →'}
        </span>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="px-4">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">✍️ 연수등록부 서명하기</h1>
          <span className="text-sm text-gray-500">연수를 선택하면 등록부에 서명할 수 있습니다</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">연수등록부가 있는 연수가 없습니다.<br /><span className="text-sm">연수 관리 &gt; 연수등록부 만들기에서 먼저 등록부를 작성해주세요.</span></div>
        ) : (
          <>
            {/* 진행 중인 연수 */}
            {activeTrainings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {activeTrainings.map((t) => <TrainingCard key={t.id} t={t} />)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 mb-6">진행 중인 연수가 없습니다.</div>
            )}

            {/* 완료된 연수 (접기/펼치기) */}
            {completedTrainings.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setCompletedOpen(prev => !prev)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
                >
                  <span>✅ 완료된 연수 ({completedTrainings.length}개)</span>
                  <span className="text-gray-400">{completedOpen ? '▲ 접기' : '▼ 펼치기'}</span>
                </button>
                {completedOpen && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4 bg-gray-50">
                    {completedTrainings.map((t) => <TrainingCard key={t.id} t={t} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default SignatureBook

