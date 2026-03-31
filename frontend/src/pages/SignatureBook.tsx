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
  const navigate = useNavigate()

  useEffect(() => {
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
    fetchTrainings()
  }, [])

  const activeTrainings = trainings.filter(t => !t.isCompleted)
  const completedTrainings = trainings.filter(t => t.isCompleted)

  const TrainingCard = ({ t }: { t: Training }) => (
    <div
      key={t.id}
      onClick={() => navigate(`/dashboard/signature-book/${t.id}`)}
      className={`bg-white rounded-xl border-2 shadow hover:shadow-md cursor-pointer p-5 transition-all ${
        t.isCompleted
          ? 'border-gray-200 hover:border-gray-300 opacity-75'
          : 'border-blue-100 hover:border-blue-300'
      }`}
    >
      <h2 className="font-bold text-gray-900 text-lg mb-2 leading-tight">{t.name}</h2>
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

