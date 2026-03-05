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
  targetUsers: string[]
  participants: { id: string }[]
}

const SignatureBook = () => {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await apiClient.get<Training[]>('/trainings')
        setTrainings(response.data)
      } catch {
        setError('연수 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchTrainings()
  }, [])

  return (
    <Layout>
      <div className="px-4">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">✍️ 연수등록부</h1>
          <span className="text-sm text-gray-500">연수를 선택하면 등록부에 서명할 수 있습니다</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">등록된 연수가 없습니다.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainings.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/dashboard/signature-book/${t.id}`)}
                className="bg-white rounded-xl border-2 border-blue-100 shadow hover:shadow-md hover:border-blue-300 cursor-pointer p-5 transition-all"
              >
                <h2 className="font-bold text-gray-900 text-lg mb-2 leading-tight">{t.name}</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  {t.department && <p>🏢 {t.department}</p>}
                  <p>👤 담당: {t.manager}</p>
                  {t.implementationDate && <p>📅 {t.implementationDate}</p>}
                  <p className="text-blue-600 font-medium">참여자 {t.participants?.length ?? 0}명</p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm font-semibold text-blue-600">등록부 보기 →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SignatureBook
