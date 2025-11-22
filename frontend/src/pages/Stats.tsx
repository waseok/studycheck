import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getTrainingStats, getIncompleteList } from '../api/stats'
import { getTrainings } from '../api/trainings'
import { Training } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const Stats = () => {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null)
  const [trainingStats, setTrainingStats] = useState<any>(null)
  const [incompleteList, setIncompleteList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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

  const chartData = trainings.map(training => ({
    name: training.name.length > 10 ? training.name.substring(0, 10) + '...' : training.name,
    전체: training.participants?.length || 0,
    완료: training.participants?.filter((p: any) => p.status === 'completed').length || 0,
    미완료: (training.participants?.length || 0) - (training.participants?.filter((p: any) => p.status === 'completed').length || 0)
  }))

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
        <h1 className="text-3xl font-bold text-gray-900">통계</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">연수별 이수 현황</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="완료" fill="#00C49F" />
                <Bar dataKey="미완료" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
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

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">미이수자 목록</h2>
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

