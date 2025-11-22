import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { isAdmin } from '../api/auth'
import { getTrainings, createTraining, updateTraining, deleteTraining } from '../api/trainings'
import { Training } from '../types'

const Trainings = () => {
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    registrationBook: '',
    cycle: '',
    targetUsers: [] as string[],
    hours: '',
    implementationDate: '',
    department: '',
    manager: '',
    method: '',
    methodLink: '',
    deadline: ''
  })

  const userTypes = ['교원', '직원', '공무직', '기간제교사', '교직원']

  useEffect(() => {
    fetchTrainings()
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

  const handleCreate = () => {
    setEditingTraining(null)
    setFormData({
      name: '',
      registrationBook: '',
      cycle: '',
      targetUsers: [],
      hours: '',
      implementationDate: '',
      department: '',
      manager: '',
      method: '',
      methodLink: '',
      deadline: ''
    })
    setShowModal(true)
  }

  const handleEdit = (training: Training) => {
    setEditingTraining(training)
    setFormData({
      name: training.name,
      registrationBook: training.registrationBook || '',
      cycle: training.cycle || '',
      targetUsers: training.targetUsers || [],
      hours: training.hours || '',
      implementationDate: training.implementationDate || '',
      department: training.department || '',
      manager: training.manager || '',
      method: training.method || '',
      methodLink: training.methodLink || '',
      deadline: training.deadline ? training.deadline.split('T')[0] : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteTraining(id)
      fetchTrainings()
    } catch (error) {
      console.error('연수 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleTargetUserToggle = (userType: string) => {
    setFormData({
      ...formData,
      targetUsers: formData.targetUsers.includes(userType)
        ? formData.targetUsers.filter(t => t !== userType)
        : [...formData.targetUsers, userType]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTraining) {
        await updateTraining(editingTraining.id, formData)
      } else {
        await createTraining(formData)
      }
      setShowModal(false)
      fetchTrainings()
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">연수 관리</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            연수 등록
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연수명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    대상자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    담당자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이수 기한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    참여자 수
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trainings.map((training) => (
                  <tr key={training.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {training.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {training.targetUsers?.join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {training.manager || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {training.deadline
                        ? new Date(training.deadline).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {training.participants?.length || 0}명
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/dashboard/trainings/${training.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        취합
                      </button>
                      <button
                        onClick={() => handleEdit(training)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(training.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
              <h2 className="text-xl font-bold mb-4">
                {editingTraining ? '연수 수정' : '연수 등록'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">연수명 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이수 주기</label>
                    <input
                      type="text"
                      value={formData.cycle}
                      onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이수시간</label>
                    <input
                      type="text"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">대상자 범위 *</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {userTypes.map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.targetUsers.includes(type)}
                          onChange={() => handleTargetUserToggle(type)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">실시일</label>
                    <input
                      type="text"
                      value={formData.implementationDate}
                      onChange={(e) => setFormData({ ...formData, implementationDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이수 기한</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">업무부서</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">담당자 *</label>
                    <input
                      type="text"
                      required
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">연수자료 및 방법</label>
                  <input
                    type="text"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    placeholder="예: 온라인 강의, 집합 연수 등"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">연수자료 링크</label>
                  <input
                    type="url"
                    value={formData.methodLink}
                    onChange={(e) => setFormData({ ...formData, methodLink: e.target.value })}
                    placeholder="https://example.com"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">연수등록부</label>
                  <input
                    type="text"
                    value={formData.registrationBook}
                    onChange={(e) => setFormData({ ...formData, registrationBook: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Trainings

