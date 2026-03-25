import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getMeetings, createMeeting, deleteMeeting, completeMeeting, Meeting } from '../api/meetings'
import { getUsers } from '../api/users'
import { User } from '../types'

const MeetingList = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedOpen, setCompletedOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ name: '', agenda: '', date: '', location: '' })
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  const navigate = useNavigate()

  const role = localStorage.getItem('role') as string | null
  const isAdmin = role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN'

  const fetchMeetings = async () => {
    try {
      const data = await getMeetings()
      setMeetings(data)
    } catch {
      setError('회의 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
  }, [])

  const openCreate = async () => {
    if (!users.length) {
      try {
        const data = await getUsers()
        setUsers(data)
      } catch {
        setError('교직원 목록을 불러오지 못했습니다.')
      }
    }
    setShowCreate(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const meeting = await createMeeting({
        name: form.name,
        agenda: form.agenda || undefined,
        date: form.date || undefined,
        location: form.location || undefined,
        participantIds: selectedUserIds
      })
      setShowCreate(false)
      setForm({ name: '', agenda: '', date: '', location: '' })
      setSelectedUserIds([])
      setUserSearch('')
      navigate(`/dashboard/meetings/${meeting.id}`)
    } catch {
      setError('회의 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 회의를 삭제하시겠습니까? 서명 데이터도 모두 삭제됩니다.`)) return
    try {
      await deleteMeeting(id)
      await fetchMeetings()
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  const handleComplete = async (m: Meeting) => {
    const action = m.isCompleted ? '다시 진행 중으로' : '완료'
    if (!confirm(`"${m.name}"을 ${action} 처리하시겠습니까?`)) return
    setCompleting(m.id)
    try {
      await completeMeeting(m.id, !m.isCompleted)
      await fetchMeetings()
    } catch {
      setError('처리에 실패했습니다.')
    } finally {
      setCompleting(null)
    }
  }

  const handleDuplicate = async (m: Meeting) => {
    if (duplicating) return
    setDuplicating(m.id)
    try {
      const participantIds = m.participants?.map(p => p.user.id) ?? []
      const newMeeting = await createMeeting({
        name: `${m.name} (복사본)`,
        agenda: m.agenda ?? undefined,
        date: m.date ?? undefined,
        location: m.location ?? undefined,
        participantIds
      })
      navigate(`/dashboard/meetings/${newMeeting.id}`)
    } catch {
      setError('회의 복제에 실패했습니다.')
    } finally {
      setDuplicating(null)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const filteredUsers = users.filter(u =>
    u.name.includes(userSearch) || u.userType.includes(userSearch) || (u.position || '').includes(userSearch)
  )

  const activeM = meetings.filter(m => !m.isCompleted)
  const completedM = meetings.filter(m => m.isCompleted)

  const MeetingCard = ({ m }: { m: Meeting }) => (
    <div
      onClick={() => navigate(`/dashboard/meetings/${m.id}`)}
      className={`bg-white rounded-xl border-2 shadow hover:shadow-md cursor-pointer p-5 transition-all relative ${
        m.isCompleted ? 'border-gray-200 hover:border-gray-300 opacity-75' : 'border-green-100 hover:border-green-300'
      }`}
    >
      {isAdmin && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); handleComplete(m) }}
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              m.isCompleted
                ? 'text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300'
                : 'text-gray-300 hover:text-green-600 border border-gray-200 hover:border-green-400'
            }`}
            title={m.isCompleted ? '완료 취소' : '완료 처리'}
            disabled={completing === m.id}
          >{completing === m.id ? '⏳' : m.isCompleted ? '↩' : '✓'}</button>
          <button
            onClick={e => { e.stopPropagation(); handleDuplicate(m) }}
            className="text-gray-300 hover:text-blue-500 text-sm px-1"
            title="복제"
            disabled={duplicating === m.id}
          >{duplicating === m.id ? '⏳' : '⧉'}</button>
          <button
            onClick={e => { e.stopPropagation(); handleDelete(m.id, m.name) }}
            className="text-gray-300 hover:text-red-500 text-sm px-1"
            title="삭제"
          >✕</button>
        </div>
      )}
      <h2 className="font-bold text-gray-900 text-lg mb-2 leading-tight pr-14">{m.name}</h2>
      <div className="text-sm text-gray-600 space-y-1">
        {m.date && <p>📅 {m.date}</p>}
        {m.location && <p>📍 {m.location}</p>}
        {m.agenda && <p className="text-gray-500 text-xs line-clamp-2">📋 {m.agenda}</p>}
        <p className={m.isCompleted ? 'text-gray-400 font-medium' : 'text-green-600 font-medium'}>
          참가자 {m.participants?.length ?? 0}명
        </p>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className={`text-sm font-semibold ${m.isCompleted ? 'text-gray-400' : 'text-green-600'}`}>
          {m.isCompleted ? '✅ 완료된 회의 · 등록부 보기 →' : '등록부 보기 →'}
        </span>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">📝 회의등록부</h1>
            <span className="text-sm text-gray-500">회의를 선택하면 등록부에 서명할 수 있습니다</span>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              + 새 회의 만들기
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 회의가 없습니다.
            {isAdmin && <p className="text-sm mt-2">"새 회의 만들기" 버튼으로 회의를 추가해주세요.</p>}
          </div>
        ) : (
          <>
            {activeM.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {activeM.map(m => <MeetingCard key={m.id} m={m} />)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 mb-6">진행 중인 회의가 없습니다.</div>
            )}

            {completedM.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setCompletedOpen(prev => !prev)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
                >
                  <span>✅ 완료된 회의 ({completedM.length}개)</span>
                  <span className="text-gray-400">{completedOpen ? '▲ 접기' : '▼ 펼치기'}</span>
                </button>
                {completedOpen && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4 bg-gray-50">
                    {completedM.map(m => <MeetingCard key={m.id} m={m} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 회의 생성 모달 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">새 회의 만들기</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">회의명 *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                    placeholder="회의명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">회의 안건</label>
                  <textarea
                    rows={3}
                    value={form.agenda}
                    onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none resize-none"
                    placeholder="회의 안건을 입력하세요"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">일시</label>
                    <input
                      type="text"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                      placeholder="예) 2025. 3. 18. 14:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                      placeholder="예) 도서관"
                    />
                  </div>
                </div>

                {/* 참가자 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    참가자 선택 ({selectedUserIds.length}명 선택됨)
                  </label>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none mb-2"
                    placeholder="이름, 유형, 직위로 검색"
                  />
                  <div className="border-2 border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="text-center text-gray-400 py-4 text-sm">검색 결과 없음</p>
                    ) : (
                      filteredUsers.map(u => (
                        <label
                          key={u.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleUser(u.id)}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="text-sm text-gray-900">{u.name}</span>
                          <span className="text-xs text-gray-500">{u.userType} {u.position ? `· ${u.position}` : ''}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setForm({ name: '', agenda: '', date: '', location: '' }); setSelectedUserIds([]) }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {saving ? '생성 중...' : '회의 만들기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MeetingList
