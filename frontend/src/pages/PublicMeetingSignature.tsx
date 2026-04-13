import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import SignaturePad, { SignaturePadRef } from '../components/SignaturePad'
import { getPublicMeeting, savePublicMeetingSignature } from '../api/meetings'

const PublicMeetingSignature = () => {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const signaturePadRef = useRef<SignaturePadRef>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [data, setData] = useState<any>(null)

  const fetchData = useCallback(async () => {
    if (!meetingId || !token) {
      setError('유효한 서명 링크가 아닙니다.')
      setLoading(false)
      return
    }
    try {
      const result = await getPublicMeeting(meetingId, token)
      setData(result)
      const mine = result.participants.find(p => p.userId === result.accessUserId)
      setCompleted(Boolean(mine?.signature))
    } catch (err: any) {
      setError(err?.response?.data?.error || '서명 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [meetingId, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSign = async () => {
    if (!meetingId || !token || !signaturePadRef.current) return
    if (signaturePadRef.current.isEmpty()) {
      alert('서명을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      await savePublicMeetingSignature(meetingId, token, signaturePadRef.current.toDataURL())
      setCompleted(true)
      await fetchData()
    } catch (err: any) {
      alert(err?.response?.data?.error || '서명 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const participant = data?.participants?.find((p: any) => p.userId === data?.accessUserId)

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">회의등록부 서명</h1>
        <p className="text-slate-600 text-sm mb-4">{data?.meeting?.name || '-'}</p>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{error}</div>}
        {participant && (
          <div className="mb-4 text-sm text-slate-700">
            대상자: <span className="font-medium">{participant.name}</span>
          </div>
        )}
        {completed ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded px-4 py-3">이미 서명이 완료되었습니다.</div>
        ) : (
          <>
            <SignaturePad ref={signaturePadRef} />
            <div className="mt-3 flex gap-2">
              <button onClick={() => signaturePadRef.current?.clear()} className="px-4 py-2 rounded border border-gray-300 text-gray-700">지우기</button>
              <button onClick={handleSign} disabled={saving} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50">
                {saving ? '저장 중...' : '서명 완료'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PublicMeetingSignature
