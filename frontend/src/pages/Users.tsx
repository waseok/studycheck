import { useEffect, useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import { getUsers, createUser, updateUser, deleteUser, bulkDeleteUsers, resetPin, bulkCreateUsers } from '../api/users'
import { cleanupDuplicates } from '../api/participants'
import { isAdmin } from '../api/auth'
import { User } from '../types'
import { getGroups, createGroup, updateGroup, deleteGroup, addGroupMembers, removeGroupMember, StaffGroup } from '../api/groups'

const Users = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number; details?: string[] } | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 그룹 관련 상태
  const [groups, setGroups] = useState<StaffGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<StaffGroup | null>(null)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<StaffGroup | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupMemberSearch, setGroupMemberSearch] = useState('')
  const [groupSaving, setGroupSaving] = useState(false)
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)
  const [newGroupFromSelection, setNewGroupFromSelection] = useState(false)
  const [newGroupNameFromSelection, setNewGroupNameFromSelection] = useState('')
  const groupDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
        setShowGroupDropdown(false)
        setNewGroupFromSelection(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: '교원',
    position: '',
    grade: '',
    class: '',
    role: 'USER' as 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER',
  })

  const userTypes = ['교원', '직원', '공무직', '기간제교사', '교육공무직', '교직원', '교육활동 참여자']
  const roles = [
    { value: 'SUPER_ADMIN', label: '최고 관리자' },
    { value: 'TRAINING_ADMIN', label: '연수 관리자' },
    { value: 'USER', label: '일반 사용자' },
  ] as const

  const deriveRole = (user: User): 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER' => {
    if (user.isAdmin || user.role === 'SUPER_ADMIN') return 'SUPER_ADMIN'
    if (user.role === 'TRAINING_ADMIN') return 'TRAINING_ADMIN'
    return 'USER'
  }

  useEffect(() => {
    fetchUsers()
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setGroupsLoading(true)
    try {
      const data = await getGroups()
      setGroups(data)
    } catch (error) {
      console.error('fetchGroups error:', error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const handleCreateGroup = () => {
    setEditingGroup(null)
    setGroupName('')
    setShowGroupModal(true)
  }

  const handleEditGroup = (group: StaffGroup) => {
    setEditingGroup(group)
    setGroupName(group.name)
    setShowGroupModal(true)
  }

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return
    setGroupSaving(true)
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, groupName.trim())
      } else {
        await createGroup(groupName.trim())
      }
      setShowGroupModal(false)
      await fetchGroups()
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    } finally {
      setGroupSaving(false)
    }
  }

  const handleDeleteGroup = async (group: StaffGroup) => {
    if (!confirm(`"${group.name}" 그룹을 삭제하시겠습니까?`)) return
    try {
      await deleteGroup(group.id)
      if (selectedGroup?.id === group.id) setSelectedGroup(null)
      await fetchGroups()
    } catch (error: any) {
      alert(error.response?.data?.error || '삭제 중 오류가 발생했습니다.')
    }
  }

  const handleAddGroupMember = async (userId: string) => {
    if (!selectedGroup) return
    try {
      const updated = await addGroupMembers(selectedGroup.id, [userId])
      setSelectedGroup(updated)
      await fetchGroups()
    } catch (error: any) {
      alert(error.response?.data?.error || '멤버 추가 중 오류가 발생했습니다.')
    }
  }

  const handleRemoveGroupMember = async (userId: string) => {
    if (!selectedGroup) return
    try {
      await removeGroupMember(selectedGroup.id, userId)
      const updated = { ...selectedGroup, members: selectedGroup.members.filter(m => m.userId !== userId) }
      setSelectedGroup(updated)
      await fetchGroups()
    } catch (error: any) {
      alert(error.response?.data?.error || '멤버 제거 중 오류가 발생했습니다.')
    }
  }

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
    setFormData({ name: '', email: '', userType: '교원', position: '', grade: '', class: '', role: 'USER' })
    setShowModal(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      userType: user.userType,
      position: user.position || '',
      grade: user.grade || '',
      class: user.class || '',
      role: deriveRole(user),
    })
    setShowModal(true)
  }

  const handleSelectUser = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map(u => u.id)))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteUser(id)
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
      fetchUsers()
    } catch (error) {
      console.error('교직원 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`선택한 ${selectedIds.size}명의 교직원을 삭제하시겠습니까?`)) return

    try {
      await bulkDeleteUsers(Array.from(selectedIds))
      setSelectedIds(new Set())
      fetchUsers()
    } catch (error) {
      console.error('일괄 삭제 오류:', error)
      alert('일괄 삭제 중 오류가 발생했습니다.')
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

  const handleCleanupDuplicates = async () => {
    if (!confirm('중복된 연수 참여자 레코드를 정리하시겠습니까?\n\n이 작업은 같은 연수에 대한 중복 참여자 레코드를 삭제합니다. 이수번호가 있는 레코드는 보존됩니다.')) return

    try {
      setLoading(true)
      const result = await cleanupDuplicates()
      if (result.success) {
        alert(result.message || `중복 레코드 정리가 완료되었습니다.\n삭제된 레코드: ${result.deletedCount || 0}개\n중복 그룹: ${result.duplicateGroups || 0}개`)
      } else {
        alert(result.message || '중복 레코드 정리 중 오류가 발생했습니다.')
      }
    } catch (error: any) {
      console.error('중복 레코드 정리 오류:', error)
      alert(error.response?.data?.error || '중복 레코드 정리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
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
          position: formData.position || undefined,
          grade: formData.grade || undefined,
          class: formData.class || undefined,
          role: formData.role,
        })
      } else {
        await createUser({
          name: formData.name,
          email: formData.email,
          userType: formData.userType,
          position: formData.position || undefined,
          grade: formData.grade || undefined,
          class: formData.class || undefined,
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

  const groupMemberIds = new Set(selectedGroup?.members.map(m => m.userId) ?? [])
  const filteredUsersForGroup = users.filter(u =>
    !groupMemberIds.has(u.id) &&
    (u.name.includes(groupMemberSearch) || u.userType.includes(groupMemberSearch) || (u.position || '').includes(groupMemberSearch))
  )

  const sortedUsers = [...users].sort((a, b) => {
    const getOrder = (u: typeof users[0]): number => {
      const p = (u.position ?? '').toLowerCase()
      const t = u.userType
      const hasGrade = !!u.grade && u.grade.trim() !== ''
      if (p.includes('교장')) return 0
      if (p.includes('교감')) return 1
      // 학년 담임 (grade 있는 경우)
      if ((p.includes('담임') || p.includes('학급')) && hasGrade) return 2
      if (p.includes('전담') || p.includes('교과')) return 3
      // 일반 교원 (담임/전담/교장/교감 아닌 교원, 기간제)
      if (t === '교원' || t === '기간제교사') return 4
      // 유치원 담임 포함 유치원 관련
      if (p.includes('유치') || t.includes('유치')) return 5
      // 직원 (행정실 포함)
      if (t === '직원') return 6
      // 공무직
      if (t === '공무직' || t === '교육공무직') return 7
      return 8
    }
    const orderA = getOrder(a)
    const orderB = getOrder(b)
    if (orderA !== orderB) return orderA - orderB
    const gradeA = parseInt(a.grade ?? '99')
    const gradeB = parseInt(b.grade ?? '99')
    if (gradeA !== gradeB) return gradeA - gradeB
    const classA = parseInt(a.class ?? '99')
    const classB = parseInt(b.class ?? '99')
    if (classA !== classB) return classA - classB
    return a.name.localeCompare(b.name, 'ko')
  })

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-blue-800 mb-6">👥 교직원 관리</h1>
          <div className="flex gap-2 flex-wrap justify-end">
            {selectedIds.size > 0 && (
              <div className="relative" ref={groupDropdownRef}>
                <button
                  onClick={() => { setShowGroupDropdown(v => !v); setNewGroupFromSelection(false); setNewGroupNameFromSelection('') }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  그룹에 추가 ({selectedIds.size}명) ▾
                </button>
                {showGroupDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-44">
                    {groups.map(g => (
                      <button
                        key={g.id}
                        onClick={async () => {
                          const count = selectedIds.size
                          try {
                            await addGroupMembers(g.id, Array.from(selectedIds))
                            await fetchGroups()
                            setSelectedIds(new Set())
                            setShowGroupDropdown(false)
                            alert(`"${g.name}" 그룹에 ${count}명 추가됐습니다.`)
                          } catch (err: any) {
                            alert(err.response?.data?.error || '추가 중 오류가 발생했습니다.')
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        {g.name}
                      </button>
                    ))}
                    <div className="border-t border-gray-100">
                      {newGroupFromSelection ? (
                        <div className="px-3 py-2 flex gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={newGroupNameFromSelection}
                            onChange={e => setNewGroupNameFromSelection(e.target.value)}
                            placeholder="그룹명"
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm min-w-0"
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && newGroupNameFromSelection.trim()) {
                                const count = selectedIds.size
                                try {
                                  const g = await createGroup(newGroupNameFromSelection.trim(), Array.from(selectedIds))
                                  await fetchGroups()
                                  setSelectedIds(new Set())
                                  setShowGroupDropdown(false)
                                  setNewGroupFromSelection(false)
                                  alert(`"${g.name}" 그룹이 생성되고 ${count}명이 추가됐습니다.`)
                                } catch (err: any) {
                                  alert(err.response?.data?.error || '생성 중 오류가 발생했습니다.')
                                }
                              }
                              if (e.key === 'Escape') setNewGroupFromSelection(false)
                            }}
                          />
                          <button
                            onClick={async () => {
                              if (!newGroupNameFromSelection.trim()) return
                              const count = selectedIds.size
                              try {
                                const g = await createGroup(newGroupNameFromSelection.trim(), Array.from(selectedIds))
                                await fetchGroups()
                                setSelectedIds(new Set())
                                setShowGroupDropdown(false)
                                setNewGroupFromSelection(false)
                                alert(`"${g.name}" 그룹이 생성되고 ${count}명이 추가됐습니다.`)
                              } catch (err: any) {
                                alert(err.response?.data?.error || '생성 중 오류가 발생했습니다.')
                              }
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
                          >확인</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setNewGroupFromSelection(true)}
                          className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                        >
                          + 새 그룹 만들어서 추가
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                🗑️ 선택 삭제 ({selectedIds.size}명)
              </button>
            )}
            {isAdmin() && (
              <button
                onClick={handleCleanupDuplicates}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="중복된 연수 참여자 레코드 정리"
              >
                🔧 중복 레코드 정리
              </button>
            )}
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

        {/* 탭 */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            교직원 목록
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'groups' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            그룹 관리
          </button>
        </div>

        {/* 그룹 관리 탭 */}
        {activeTab === 'groups' && (
          <div className="flex gap-4" style={{ minHeight: '500px' }}>
            {/* 그룹 목록 */}
            <div className="w-64 flex-shrink-0">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700">그룹 목록</span>
                {isAdmin() && (
                  <button onClick={handleCreateGroup} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    + 새 그룹
                  </button>
                )}
              </div>
              {groupsLoading ? (
                <div className="text-center py-8 text-gray-400">로딩 중...</div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">그룹이 없습니다</div>
              ) : (
                <div className="space-y-1">
                  {groups.map(g => (
                    <div
                      key={g.id}
                      onClick={() => { setSelectedGroup(g); setGroupMemberSearch('') }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${selectedGroup?.id === g.id ? 'bg-blue-50 border-2 border-blue-300' : 'border-2 border-transparent hover:bg-gray-50'}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{g.name}</p>
                        <p className="text-xs text-gray-400">{g.members.length}명</p>
                      </div>
                      {isAdmin() && (
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); handleEditGroup(g) }} className="text-gray-400 hover:text-blue-600 text-xs px-1">수정</button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteGroup(g) }} className="text-gray-400 hover:text-red-600 text-xs px-1">삭제</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 그룹 상세 */}
            <div className="flex-1 bg-white rounded-2xl border-2 border-gray-200 p-4">
              {!selectedGroup ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  좌측에서 그룹을 선택하세요
                </div>
              ) : (
                <div className="flex gap-4 h-full">
                  {/* 현재 멤버 */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      "{selectedGroup.name}" 멤버 ({selectedGroup.members.length}명)
                    </h3>
                    {selectedGroup.members.length === 0 ? (
                      <p className="text-gray-400 text-sm">멤버가 없습니다. 우측에서 추가하세요.</p>
                    ) : (
                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {selectedGroup.members.map(m => (
                          <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{m.user.name}</span>
                              <span className="text-xs text-gray-500 ml-2">{m.user.userType}{m.user.position ? ` · ${m.user.position}` : ''}</span>
                            </div>
                            {isAdmin() && (
                              <button onClick={() => handleRemoveGroupMember(m.userId)} className="text-red-400 hover:text-red-600 text-xs">제거</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 추가 가능한 교직원 */}
                  {isAdmin() && (
                    <div className="w-64 flex-shrink-0 border-l pl-4">
                      <h3 className="font-semibold text-gray-700 mb-3">교직원 추가</h3>
                      <input
                        type="text"
                        value={groupMemberSearch}
                        onChange={e => setGroupMemberSearch(e.target.value)}
                        placeholder="이름, 유형으로 검색"
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-2"
                      />
                      <div className="space-y-1 max-h-80 overflow-y-auto">
                        {filteredUsersForGroup.length === 0 ? (
                          <p className="text-gray-400 text-xs text-center py-4">추가할 교직원 없음</p>
                        ) : (
                          filteredUsersForGroup.map(u => (
                            <div key={u.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded">
                              <div>
                                <span className="text-sm text-gray-900">{u.name}</span>
                                <span className="text-xs text-gray-400 ml-1">{u.userType}</span>
                              </div>
                              <button onClick={() => handleAddGroupMember(u.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">추가</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : activeTab === 'users' && (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border-4 border-blue-200">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={sortedUsers.length > 0 && selectedIds.size === sortedUsers.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">직위</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">권한</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className={selectedIds.has(user.id) ? 'bg-red-50' : ''}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.userType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.position || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.grade || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.class || '-'}</td>
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
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-4 border-blue-300">
              <h2 className="text-xl font-bold mb-4">{editingUser ? '교직원 수정' : '교직원 등록'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">유형</label>
                  <select value={formData.userType} onChange={(e) => setFormData({ ...formData, userType: e.target.value })} className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    {userTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">직위 (선택)</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="예: 교사, 주임교사 등"
                      className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">학년 (선택)</label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      placeholder="예: 1, 2, 3"
                      className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">반 (선택)</label>
                    <input
                      type="text"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      placeholder="예: 1, 2, 3"
                      className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">권한</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">- 최고 관리자: 사용자/권한 관리, PIN 초기화 포함
                    <br/>- 연수 관리자: 연수/통계 관리
                    <br/>- 일반 사용자: 내 연수 관리</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition-all">취소</button>
                  <button type="submit" className="px-5 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95">저장</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 엑셀 일괄 등록 모달 */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-4 border-blue-300">
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
                      • 유형: 교원, 직원, 공무직, 기간제교사, 교육공무직, 교직원, 교육활동 참여자<br/>
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

        {/* 그룹 생성/수정 모달 */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-4 border-blue-300">
              <h2 className="text-xl font-bold mb-4">{editingGroup ? '그룹 수정' : '새 그룹 만들기'}</h2>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="그룹명 입력"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-4 focus:border-blue-500 focus:outline-none"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveGroup() }}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowGroupModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">취소</button>
                <button onClick={handleSaveGroup} disabled={groupSaving || !groupName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {groupSaving ? '저장 중...' : '저장'}
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

