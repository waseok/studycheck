import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { isAdmin, getRole } from '../api/auth'
import { getTrainings } from '../api/trainings'
import { getMyTrainings } from '../api/participants'
import { getIncompleteList } from '../api/stats'
import { Training, TrainingParticipant } from '../types'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const Dashboard = () => {
  const [myTrainings, setMyTrainings] = useState<TrainingParticipant[]>([])
  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [incompleteList, setIncompleteList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const adminUser = isAdmin()
  const role = getRole()
  
  const COLORS = ['#00C49F', '#FF8042']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 모든 사용자: 내 연수 목록
      const myTrainingsData = await getMyTrainings()
      // 미완료 연수를 위로 정렬
      const sorted = [...myTrainingsData].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1
        if (a.status !== 'completed' && b.status === 'completed') return -1
        return 0
      })
      setMyTrainings(sorted)

      // 관리자: 전체 연수 목록 및 통계
      if (adminUser || role === 'TRAINING_ADMIN') {
        const trainingsData = await getTrainings()
        setAllTrainings(trainingsData)
        
        const incompleteData = await getIncompleteList()
        setIncompleteList(incompleteData)
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }


  // 연수별 통계 계산
  const trainingStats = allTrainings.map(training => {
    const total = training.participants?.length || 0
    const completed = training.participants?.filter((p: any) => p.status === 'completed').length || 0
    const pending = total - completed
    const completionRate = total > 0 ? (completed / total) * 100 : 0
    
    return {
      id: training.id,
      name: training.name,
      total,
      completed,
      pending,
      completionRate,
      pieData: [
        { name: '완료', value: completed },
        { name: '미완료', value: pending }
      ]
    }
  })

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
        <div>
          <h1 className="text-4xl font-bold text-blue-800 mb-2">🏠 대시보드</h1>
          <p className="text-lg text-gray-700">와석초 의무연수 안내 취합 통합 플랫폼에 오신 것을 환영합니다.</p>
        </div>

        {/* 나의 연수 목록 */}
        <div className="bg-white shadow-xl rounded-2xl p-6 border-4 border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-800">✏️ 나의 연수</h2>
            <Link 
              to="/dashboard/my-trainings" 
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
            >
              전체 보기 →
            </Link>
          </div>
          
          {myTrainings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              참여 중인 연수가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {myTrainings.slice(0, 5).map((participant) => {
                const training = participant.training
                if (!training) return null

                return (
                  <div 
                    key={participant.id} 
                    className={`p-4 rounded-xl border-2 ${
                      participant.status !== 'completed' 
                        ? 'border-yellow-300 bg-yellow-50' 
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{training.name}</h3>
                        {training.deadline && (
                          <p className={`text-sm mt-1 font-semibold ${
                            participant.status !== 'completed' ? 'text-red-600 text-base' : 'text-gray-600'
                          }`}>
                            이수 기한: {new Date(training.deadline).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          participant.status === 'completed'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {participant.status === 'completed' ? '완료' : '미완료'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 관리자/연수 관리자용: 연수 목록 및 통계 */}
        {(adminUser || role === 'TRAINING_ADMIN') && (
          <>
            {/* 연수 목록 */}
            <div className="bg-white shadow-xl rounded-2xl p-6 border-4 border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-800">📖 연수 목록</h2>
                <Link 
                  to="/dashboard/trainings" 
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  전체 보기 →
                </Link>
              </div>
              
              {allTrainings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  등록된 연수가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {allTrainings.slice(0, 5).map((training) => {
                    const total = training.participants?.length || 0
                    const completed = training.participants?.filter((p: any) => p.status === 'completed').length || 0
                    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0

                    return (
                      <div key={training.id} className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{training.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              참여자: {total}명 | 완료: {completed}명 | 완료율: {completionRate}%
                            </p>
                          </div>
                          <Link
                            to={`/dashboard/trainings/${training.id}`}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                          >
                            상세 보기 →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 연수 통계 */}
            <div className="bg-white shadow-xl rounded-2xl p-6 border-4 border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-800">📊 연수 통계</h2>
                <Link 
                  to="/dashboard/stats" 
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  전체 보기 →
                </Link>
              </div>
              
              {trainingStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  통계 데이터가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trainingStats.slice(0, 4).map((stat) => (
                    <div key={stat.id} className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                        {stat.name.length > 20 ? stat.name.substring(0, 20) + '...' : stat.name}
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <ResponsiveContainer width={80} height={80}>
                            <PieChart>
                              <Pie
                                data={stat.pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                outerRadius={35}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {stat.pieData.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <span>완료: {stat.completed}명</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                            <span>미완료: {stat.pending}명</span>
                          </div>
                          <div className="pt-2 font-semibold text-blue-600">
                            이수율: {stat.completionRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 미이수자 목록 */}
            {incompleteList.length > 0 && (
              <div className="bg-white shadow-xl rounded-2xl p-6 border-4 border-red-200">
                <h2 className="text-2xl font-bold text-red-800 mb-4">⚠️ 미이수자 알림</h2>
                <div className="space-y-2">
                  {incompleteList.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm">
                        <span className="font-semibold">{item.user?.name || '-'}</span>님의{' '}
                        <span className="font-semibold">{item.training?.name || '-'}</span> 연수가 미완료 상태입니다.
                      </p>
                    </div>
                  ))}
                  {incompleteList.length > 5 && (
                    <p className="text-sm text-gray-600 text-center mt-2">
                      외 {incompleteList.length - 5}명의 미이수자가 있습니다.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
