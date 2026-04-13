import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getMyProfile, updateMyProfile } from '../api/users'
import { getSavedSignature } from '../api/signatures'
import { User } from '../types'

const Profile = () => {
  const [, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: '교원',
    position: '',
    grade: '',
    class: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savedSignature, setSavedSignature] = useState<string | null>(null)

  const userTypes = ['교원', '직원', '공무직', '기간제교사', '교육공무직', '교직원', '교육활동 참여자']

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const data = await getMyProfile()
      setUser(data)
      setFormData({
        name: data.name || '',
        email: data.email || '',
        userType: data.userType || '교원',
        position: data.position || '',
        grade: data.grade || '',
        class: data.class || ''
      })
      const mySavedSignature = await getSavedSignature()
      setSavedSignature(mySavedSignature)
    } catch (error: any) {
      console.error('내 정보 조회 오류:', error)
      setError('내 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const result = await updateMyProfile(formData)
      setSuccess(result.message || '내 정보가 수정되었습니다.')
      setUser(result.user)
    } catch (error: any) {
      console.error('내 정보 수정 오류:', error)
      setError(error.response?.data?.error || '내 정보 수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadSignature = () => {
    if (!savedSignature) return
    const link = document.createElement('a')
    link.href = savedSignature
    link.download = `내_서명_${new Date().toISOString().slice(0, 10)}.png`
    link.click()
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">내 정보</h1>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 (ID) *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                유형 *
              </label>
              <select
                required
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                className="block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {userTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                직위 (선택사항)
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="직위를 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학년 (선택사항)
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="학년"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반 (선택사항)
                </label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="반"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>학년/반 변경 안내:</strong> 매년 학년이 올라가거나 반이 바뀔 때 여기서 직접 수정할 수 있습니다.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={fetchProfile}
                className="px-4 py-2 border-2 border-gray-400 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mt-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">저장된 서명</h2>
          {savedSignature ? (
            <>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <img src={savedSignature} alt="저장된 서명" className="max-h-32 object-contain mx-auto" />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadSignature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  서명 이미지 다운로드
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">저장된 서명이 없습니다. 연수/회의 서명 창에서 &quot;이 서명 저장해두기&quot;를 먼저 사용해주세요.</div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Profile

