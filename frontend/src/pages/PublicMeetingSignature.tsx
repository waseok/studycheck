import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import SignaturePad, { SignaturePadRef } from '../components/SignaturePad'
import { getPublicMeeting, savePublicMeetingSignature, MeetingParticipant } from '../api/meetings'

const PublicMeetingSignature = () => {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const signaturePadRef = useRef<SignaturePadRef>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<Awaited<ReturnType<typeof getPublicMeeting>> | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [hideSigned, setHideSigned] = useState(false)
  const [signComplete, setSignComplete] = useState(false)

  const fetchData = useCallback(async () => {
    if (!meetingId || !token) {
      setError('유효한 서명 링크가 아닙니다.')
      setLoading(false)
      return
    }
    try {
      const result = await getPublicMeeting(meetingId, token)
      setData(result)
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
    if (!selectedUserId) {
      alert('서명하기 전에 본인의 이름을 선택하세요!')
      return
    }
    if (signaturePadRef.current.isEmpty()) {
      alert('서명을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      await savePublicMeetingSignature(meetingId, token, signaturePadRef.current.toDataURL(), selectedUserId)
      setSignComplete(true)
      setTimeout(() => {
        window.close()
      }, 1500)
    } catch (err: any) {
      alert(err?.response?.data?.error || '서명 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const participant = data?.participants?.find((p: MeetingParticipant) => p.userId === selectedUserId)
  const completed = Boolean(participant?.signature)
  const isAbsent = Boolean(participant?.absenceReason)
  const sortedParticipants = useMemo(() => {
    return [...(data?.participants ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [data?.participants])
  const visibleParticipants = hideSigned
    ? sortedParticipants.filter((p) => !p.signature && !p.absenceReason)
    : sortedParticipants

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>

  if (signComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow border border-green-200 p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-green-800 mb-2">서명이 완료되었습니다</h1>
          <p className="text-gray-600 text-sm">이 페이지를 닫아주세요.</p>
          <p className="text-gray-400 text-xs mt-3">창이 자동으로 닫히지 않으면 브라우저 탭을 직접 닫아주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">회의등록부 서명</h1>
        <p className="text-slate-600 text-sm mb-4">{data?.meeting?.name || '-'}</p>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{error}</div>}
        {sortedParticipants.length ? (
          <div className="mb-4 text-sm text-slate-700">
            <div className="mb-3 bg-amber-50 border-2 border-amber-400 rounded-lg px-4 py-3 text-amber-900 font-semibold text-center">
              ⚠️ 서명하기 전에 본인의 이름을 선택하세요!
            </div>
            <label className="inline-flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={hideSigned}
                onChange={(e) => setHideSigned(e.target.checked)}
              />
              <span>서명완료자 숨기기</span>
            </label>
            <label className="block mb-1 font-medium">대상자 선택</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">▼ 본인의 이름을 선택하세요</option>
              {visibleParticipants.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.name} ({p.signature ? '서명완료' : p.absenceReason ? '불참' : '미서명'})
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {!selectedUserId ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-500 rounded px-4 py-6 text-center text-sm">
            위 목록에서 본인의 이름을 선택한 후 서명해 주세요.
          </div>
        ) : completed ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded px-4 py-3">이미 서명이 완료되었습니다.</div>
        ) : isAbsent ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded px-4 py-3">
            불참 처리된 대상자입니다. ({participant?.absenceReason})
          </div>
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
