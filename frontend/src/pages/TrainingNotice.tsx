import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  getTrainingNotices,
  createTrainingNotice,
  updateTrainingNotice,
  deleteTrainingNotice,
  TrainingNotice,
} from '../api/trainingNotices'

const EMPTY_FORM = { order: 1, name: '', targetUsers: '', hours: '', manager: '', method: '' }

export default function TrainingNoticePage() {
  const [notices, setNotices] = useState<TrainingNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRow, setShowAddRow] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const role = localStorage.getItem('role')
  const isAdmin = role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN'
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || null
    } catch { return null }
  })()

  const fetchNotices = async () => {
    try {
      const data = await getTrainingNotices()
      setNotices(data)
    } catch {
      alert('목록을 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotices() }, [])

  const handleAdd = async () => {
    if (!formData.name.trim()) { alert('연수명을 입력해주세요.'); return }
    setSaving(true)
    try {
      await createTrainingNotice({
        order: formData.order,
        name: formData.name,
        targetUsers: formData.targetUsers || null,
        hours: formData.hours || null,
        manager: formData.manager || null,
        method: formData.method || null,
      })
      setFormData(EMPTY_FORM)
      setShowAddRow(false)
      fetchNotices()
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleStartEdit = (notice: TrainingNotice) => {
    setEditingId(notice.id)
    setEditData({
      order: notice.order,
      name: notice.name,
      targetUsers: notice.targetUsers || '',
      hours: notice.hours || '',
      manager: notice.manager || '',
      method: notice.method || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editData.name.trim()) { alert('연수명을 입력해주세요.'); return }
    setSaving(true)
    try {
      await updateTrainingNotice(editingId!, {
        order: editData.order,
        name: editData.name,
        targetUsers: editData.targetUsers || null,
        hours: editData.hours || null,
        manager: editData.manager || null,
        method: editData.method || null,
      })
      setEditingId(null)
      fetchNotices()
    } catch {
      alert('수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return
    try {
      await deleteTrainingNotice(id)
      fetchNotices()
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const canEditRow = (notice: TrainingNotice) =>
    isAdmin || notice.createdById === currentUserId

  const inputCls = 'w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400'

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">📋 연수 안내</h1>
          <button
            onClick={() => { setShowAddRow(true); setEditingId(null) }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
          >
            + 항목 추가
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">로딩 중...</div>
        ) : (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border-4 border-blue-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-14">순번</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">연수명</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">대상자</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">이수시간</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">담당자</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">연수자료 및 방법</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">작성자</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notices.length === 0 && !showAddRow && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-400 text-sm">
                        등록된 연수 안내가 없습니다. 항목을 추가해주세요.
                      </td>
                    </tr>
                  )}

                  {notices.map((notice) =>
                    editingId === notice.id ? (
                      <tr key={notice.id} className="bg-blue-50">
                        <td className="px-2 py-2">
                          <input type="number" className={inputCls} value={editData.order} onChange={e => setEditData({ ...editData, order: parseInt(e.target.value) || 1 })} min={1} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" className={inputCls} value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder="연수명 *" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" className={inputCls} value={editData.targetUsers} onChange={e => setEditData({ ...editData, targetUsers: e.target.value })} placeholder="대상자" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" className={inputCls} value={editData.hours} onChange={e => setEditData({ ...editData, hours: e.target.value })} placeholder="이수시간" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" className={inputCls} value={editData.manager} onChange={e => setEditData({ ...editData, manager: e.target.value })} placeholder="담당자" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" className={inputCls} value={editData.method} onChange={e => setEditData({ ...editData, method: e.target.value })} placeholder="연수자료 및 방법" />
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-400">{notice.createdBy.name}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-right space-x-1">
                          <button onClick={handleSaveEdit} disabled={saving} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">저장</button>
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">취소</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={notice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center text-sm text-gray-700">{notice.order}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{notice.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{notice.targetUsers || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{notice.hours || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{notice.manager || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{notice.method || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{notice.createdBy.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                          {canEditRow(notice) && (
                            <>
                              <button onClick={() => handleStartEdit(notice)} className="text-indigo-600 hover:text-indigo-900 text-sm">수정</button>
                              <button onClick={() => handleDelete(notice.id)} className="text-red-600 hover:text-red-900 text-sm">삭제</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  )}

                  {/* 추가 입력 행 */}
                  {showAddRow && (
                    <tr className="bg-green-50">
                      <td className="px-2 py-2">
                        <input type="number" className={inputCls} value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })} min={1} />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" className={inputCls} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="연수명 *" autoFocus />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" className={inputCls} value={formData.targetUsers} onChange={e => setFormData({ ...formData, targetUsers: e.target.value })} placeholder="대상자" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" className={inputCls} value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} placeholder="이수시간" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" className={inputCls} value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })} placeholder="담당자" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" className={inputCls} value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })} placeholder="연수자료 및 방법" />
                      </td>
                      <td className="px-2 py-2"></td>
                      <td className="px-2 py-2 whitespace-nowrap text-right space-x-1">
                        <button onClick={handleAdd} disabled={saving} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">저장</button>
                        <button onClick={() => { setShowAddRow(false); setFormData(EMPTY_FORM) }} className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">취소</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
