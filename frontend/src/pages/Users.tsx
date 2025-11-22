import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import { getUsers, createUser, updateUser, deleteUser, resetPin, bulkCreateUsers } from '../api/users'
import { User } from '../types'

const Users = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number; details?: string[] } | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: '교원',
    role: 'USER' as 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER',
  })

  const userTypes = ['교원', '직원', '공무직', '기간제교사', '교육공무직', '교직원']
  const roles = [
    { value: 'SUPER_ADMIN', label: '최고 관리자' },
    { value: 'TRAINING_ADMIN', label: '연수 관리자' },
    { value: 'USER', label: '일반 사용자' },
  ] as const

  const deriveRole = (user: User): 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER' => {
    if (user.isAdmin) return 'SUPER_ADMIN'
    if (user.userType === '연수관리자') return 'TRAINING_ADMIN'
    return 'USER'
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (error) {
      console.error('교직원 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', userType: '교원', role: 'USER' })
    setShowModal(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      userType: user.userType,
      role: deriveRole(user),
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteUser(id)
      fetchUsers()
    } catch (error) {
      console.error('교직원 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleResetPin = async (id: string, name: string) => {
    if (!confirm(`${name}님의 PIN을 초기화하시겠습니까? 초기 비밀번호로 다시 로그인하여 PIN을 설정해야 합니다.`)) return

    try {
      const result = await resetPin(id)
      alert(result.message || 'PIN이 초기화되었습니다.')
      fetchUsers()
    } catch (error: any) {
      console.error('PIN 초기화 오류:', error)
      alert(error.response?.data?.error || 'PIN 초기화 중 오류가 발생했습니다.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          userType: formData.userType,
          role: formData.role,
        })
      } else {
        await createUser({
          name: formData.name,
          email: formData.email,
          userType: formData.userType,
          role: formData.role,
        })
      }
      setShowModal(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Save error:', error)
      const errorMessage = error.response?.data?.error || error.message || '저장 중 오류가 발생했습니다.'
      alert(errorMessage)
    }
  }

  // 엑셀 템플릿 다운로드
  const downloadTemplate = async () => {
    try {
      // 백엔드 API를 통해 템플릿 다운로드 (샘플 데이터 포함)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/users/template', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('템플릿 다운로드 실패')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `교직원_등록_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('템플릿 다운로드 오류:', error)
      // 백엔드 API 실패 시 클라이언트 사이드에서 생성
      const templateData = [
        ['이름', '이메일', '유형', '권한'],
        ['홍길동', 'hong@example.com', '교원', '일반 사용자'],
        ['김철수', 'kim@example.com', '직원', '연수 관리자'],
        ['이영희', 'lee@example.com', '공무직', '일반 사용자'],
        ['박민수', 'park@example.com', '교원', '최고 관리자'],
        ['정수진', 'jung@example.com', '기간제교사', '일반 사용자'],
        ['최도현', 'choi@example.com', '교육공무직', '연수 관리자'],
      ]

      const ws = XLSX.utils.aoa_to_sheet(templateData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '교직원 목록')

      // 열 너비 설정
      ws['!cols'] = [
        { wch: 15 }, // 이름
        { wch: 30 }, // 이메일
        { wch: 15 }, // 유형
        { wch: 20 }, // 권한
      ]

      XLSX.writeFile(wb, '교직원_등록_템플릿.xlsx')
    }
  }

  // 엑셀 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 확장자 확인
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const result = await bulkCreateUsers(file)
      setUploadResult({
        success: true,
        message: result.message,
        count: result.count,
      })
      fetchUsers()
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        setShowBulkModal(false)
        setUploadResult(null)
      }, 3000)
    } catch (error: any) {
      console.error('일괄 등록 오류:', error)
      const errorMessage = error.response?.data?.error || '일괄 등록 중 오류가 발생했습니다.'
      const errorDetails = error.response?.data?.details
      
      setUploadResult({
        success: false,
        message: errorMessage,
        details: errorDetails,
      })
    } finally {
      setUploading(false)
      // 파일 입력 초기화
      e.target.value = ''
    }
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">교직원 관리</h1>
          <div className="flex gap-2">
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              📥 엑셀 템플릿 다운로드
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              📤 엑셀 일괄 등록
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              교직원 등록
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">권한</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.userType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{
                      deriveRole(user) === 'SUPER_ADMIN' ? '최고 관리자' : deriveRole(user) === 'TRAINING_ADMIN' ? '연수 관리자' : '일반 사용자'
                    }</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900">수정</button>
                      <button onClick={() => handleResetPin(user.id, user.name)} className="text-yellow-600 hover:text-yellow-900">PIN 초기화</button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">{editingUser ? '교직원 수정' : '교직원 등록'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">유형</label>
                  <select value={formData.userType} onChange={(e) => setFormData({ ...formData, userType: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    {userTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">권한</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">- 최고 관리자: 사용자/권한 관리, PIN 초기화 포함
                    <br/>- 연수 관리자: 연수/통계 관리
                    <br/>- 일반 사용자: 내 연수 관리</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">취소</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">저장</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 엑셀 일괄 등록 모달 */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">엑셀 일괄 등록</h2>
              
              {uploadResult ? (
                <div className={`p-4 rounded-md ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {uploadResult.message}
                  </p>
                  {uploadResult.success && uploadResult.count !== undefined && (
                    <p className="text-green-700 text-sm mt-2">
                      총 {uploadResult.count}명의 교직원이 등록되었습니다.
                    </p>
                  )}
                  {uploadResult.details && uploadResult.details.length > 0 && (
                    <div className="mt-3">
                      <p className="text-red-700 text-sm font-medium">오류 상세:</p>
                      <ul className="text-red-600 text-xs mt-1 list-disc list-inside max-h-40 overflow-y-auto">
                        {uploadResult.details.map((detail, index) => (
                          <li key={index}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      엑셀 파일을 업로드하여 교직원을 일괄 등록할 수 있습니다.
                    </p>
                    <p className="text-xs text-gray-500">
                      • 파일 형식: .xlsx, .xls<br/>
                      • 필수 열: 이름, 이메일, 유형, 권한<br/>
                      • 유형: 교원, 직원, 공무직, 기간제교사, 교육공무직, 교직원<br/>
                      • 권한: 최고 관리자, 연수 관리자, 일반 사용자
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      엑셀 파일 선택
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                  
                  {uploading && (
                    <div className="text-center py-4">
                      <p className="text-indigo-600">업로드 중...</p>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false)
                    setUploadResult(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {uploadResult && uploadResult.success ? '확인' : '닫기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Users

