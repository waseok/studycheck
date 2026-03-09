import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import Layout from '../components/Layout'
import SignaturePad, { SignaturePadRef } from '../components/SignaturePad'
import { getSignatureBook, saveSignature, deleteSignature, syncSignatureStatus, SignatureBookData, SignatureParticipant } from '../api/signatures'

const SignatureBookDetail = () => {
  const { trainingId } = useParams<{ trainingId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<SignatureBookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signingUserId, setSigningUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const printRef = useRef<HTMLDivElement>(null)
  const signaturePadRef = useRef<SignaturePadRef>(null)

  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || null
    } catch {
      return null
    }
  })()

  const role = localStorage.getItem('role') as string | null
  const isAdmin = role === 'SUPER_ADMIN' || role === 'TRAINING_ADMIN'

  const fetchData = useCallback(async () => {
    if (!trainingId) return
    try {
      const result = await getSignatureBook(trainingId)
      setData(result)
    } catch (err: any) {
      const status = err?.response?.status
      const msg = err?.response?.data?.error || err?.message || '알 수 없는 오류'
      setError(`등록부를 불러오지 못했습니다. (${status ? `HTTP ${status}: ` : ''}${msg})`)
    } finally {
      setLoading(false)
    }
  }, [trainingId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSign = async () => {
    if (!signaturePadRef.current || !trainingId || !signingUserId) return
    if (signaturePadRef.current.isEmpty()) {
      alert('서명을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const imageData = signaturePadRef.current.toDataURL()
      await saveSignature(trainingId, imageData)
      setSigningUserId(null)
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || '서명 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncStatus = async () => {
    if (!trainingId) return
    try {
      const result = await syncSignatureStatus(trainingId)
      alert(`${result.updated}명의 이수 상태가 완료로 업데이트되었습니다.`)
      await fetchData()
    } catch {
      alert('동기화에 실패했습니다.')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!trainingId) return
    try {
      await deleteSignature(trainingId, userId)
      setDeleteConfirm(null)
      await fetchData()
    } catch {
      alert('서명 삭제에 실패했습니다.')
    }
  }

  const formatAffiliation = (p: SignatureParticipant) => {
    if (p.grade && p.class) return `${p.grade}학년 ${p.class}반`
    if (p.grade) return `${p.grade}학년`
    return p.userType
  }

  // 교원-유치원-행정실-그 외 순 정렬
  const sortedParticipants = [...(data?.participants ?? [])].sort((a, b) => {
    const getOrder = (p: SignatureParticipant): number => {
      const isTeacher = p.userType === '교원' || p.userType === '기간제교사'
      if (isTeacher) {
        if (p.position === '교장' || p.position === '교감') return 0
        if (p.grade && p.class) return 1  // 학급 담임
        return 2  // 교과 전담
      }
      if (p.userType === '유치원') return 3
      if (['직원', '공무직', '교육공무직', '교직원'].includes(p.userType)) return 4
      return 5
    }
    const oa = getOrder(a), ob = getOrder(b)
    if (oa !== ob) return oa - ob
    const ga = parseInt(a.grade || '99') || 99
    const gb = parseInt(b.grade || '99') || 99
    if (ga !== gb) return ga - gb
    const ca = parseInt(a.class || '99') || 99
    const cb = parseInt(b.class || '99') || 99
    if (ca !== cb) return ca - cb
    return a.name.localeCompare(b.name, 'ko')
  })

  const exportPNG = async () => {
    if (!printRef.current || !data) return
    setExporting(true)
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `${data.training.name}_등록부.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('PNG 내보내기에 실패했습니다.')
    } finally {
      setExporting(false)
    }
  }

  const exportPDF = async () => {
    if (!printRef.current || !data) return
    setExporting(true)
    try {
      // 관리 버튼(no-print) 요소 임시 숨김
      const noPrintEls = printRef.current.querySelectorAll<HTMLElement>('.no-print')
      noPrintEls.forEach(el => { el.style.display = 'none' })

      const canvas = await html2canvas(printRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      // 관리 버튼 복원
      noPrintEls.forEach(el => { el.style.display = '' })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const margin = 8
      const pdfPageW = pdf.internal.pageSize.getWidth() - margin * 2
      const pdfPageH = pdf.internal.pageSize.getHeight() - margin * 2

      // 캔버스 px → mm 비율
      const pxPerMm = canvas.width / pdfPageW
      const pageHeightPx = pdfPageH * pxPerMm
      const totalPages = Math.ceil(canvas.height / pageHeightPx)

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage()

        const srcY = page * pageHeightPx
        const srcH = Math.min(pageHeightPx, canvas.height - srcY)

        const slice = document.createElement('canvas')
        slice.width = canvas.width
        slice.height = srcH
        slice.getContext('2d')?.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

        const imgData = slice.toDataURL('image/jpeg', 0.75)
        const sliceHeightMm = srcH / pxPerMm
        pdf.addImage(imgData, 'JPEG', margin, margin, pdfPageW, sliceHeightMm)
      }

      pdf.save(`${data.training.name}_등록부.pdf`)
    } catch {
      alert('PDF 내보내기에 실패했습니다.')
    } finally {
      setExporting(false)
    }
  }

  const myParticipant = data?.participants.find(p => p.userId === currentUserId)
  const signedCount = sortedParticipants.filter(p => p.signature).length
  const totalCount = sortedParticipants.length

  // 연수등록부의 연수내용-담당자 쌍 파싱
  const trainingItems: { content: string; manager: string }[] | null = (() => {
    if (!data?.training.registrationBook) return null
    try {
      const parsed = JSON.parse(data.training.registrationBook)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
      return null
    } catch { return null }
  })()

  return (
    <Layout>
      <div className="px-4 max-w-5xl mx-auto">
        {/* 상단 버튼 */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <button
            onClick={() => navigate('/dashboard/signature-book')}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1"
          >
            ← 목록
          </button>
          <div className="flex-1" />
          {data && (
            <>
              {isAdmin && (
                <button
                  onClick={handleSyncStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
                  title="서명했지만 미완료 상태인 참여자를 완료로 일괄 처리"
                >
                  🔄 이수상태 동기화
                </button>
              )}
              <button
                onClick={exportPNG}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                🖼️ PNG 저장
              </button>
              <button
                onClick={exportPDF}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
              >
                📄 PDF 저장
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : data ? (
          <>
            {/* 서명 현황 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-4">
              <span className="text-blue-800 font-medium">서명 현황</span>
              <span className="text-blue-700">{signedCount} / {totalCount}명 완료</span>
              {myParticipant && !myParticipant.signature && (
                <button
                  onClick={() => setSigningUserId(currentUserId)}
                  className="ml-auto px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  ✍️ 내 서명하기
                </button>
              )}
              {myParticipant?.signature && (
                <span className="ml-auto text-green-700 font-medium text-sm">✅ 서명 완료</span>
              )}
            </div>

            {/* 연수등록부 (출력 영역) */}
            <div ref={printRef} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              {/* 제목 */}
              <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">연수등록부</h1>

              {/* 연수 정보 */}
              <table className="w-full mb-5 text-sm border border-gray-400" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <th className="bg-gray-100 border border-gray-400 px-3 py-2 text-left font-semibold w-24">연수명</th>
                    <td className="border border-gray-400 px-3 py-2 font-medium" colSpan={3}>{data.training.name}</td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border border-gray-400 px-3 py-2 text-left font-semibold">실시일</th>
                    <td className="border border-gray-400 px-3 py-2">{data.training.implementationDate || '-'}</td>
                    <th className="bg-gray-100 border border-gray-400 px-3 py-2 text-left font-semibold w-20">이수시간</th>
                    <td className="border border-gray-400 px-3 py-2">{data.training.hours || '-'}</td>
                  </tr>
                  {!trainingItems && (
                    <tr>
                      <th className="bg-gray-100 border border-gray-400 px-3 py-2 text-left font-semibold">업무부서</th>
                      <td className="border border-gray-400 px-3 py-2">{data.training.department || '-'}</td>
                      <th className="bg-gray-100 border border-gray-400 px-3 py-2 text-left font-semibold">담당자</th>
                      <td className="border border-gray-400 px-3 py-2">{data.training.manager}</td>
                    </tr>
                  )}
                  {trainingItems && (
                    <tr>
                      <th className="bg-gray-100 border border-gray-400 px-3 py-2 text-left font-semibold">업무부서</th>
                      <td className="border border-gray-400 px-3 py-2" colSpan={3}>{data.training.department || '-'}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 연수내용-담당자 테이블 (연수등록부 만들기로 생성된 경우) */}
              {trainingItems && (
                <table className="w-full mb-5 text-sm border border-gray-400" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-2 py-2 text-center w-10">순번</th>
                      <th className="border border-gray-400 px-2 py-2 text-left">연수 내용</th>
                      <th className="border border-gray-400 px-2 py-2 text-center w-28">담당자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingItems.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 px-2 py-2 text-center text-gray-600">{idx + 1}</td>
                        <td className="border border-gray-400 px-2 py-2">{item.content}</td>
                        <td className="border border-gray-400 px-2 py-2 text-center">{item.manager}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 서명 테이블 */}
              <table className="w-full text-sm border border-gray-400" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-2 py-2 text-center w-10">순번</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-28">소속</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-24">직위</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-20">성명</th>
                    <th className="border border-gray-400 px-2 py-2 text-center">서명</th>
                    {isAdmin && (
                      <th className="border border-gray-400 px-2 py-2 text-center w-16 no-print">관리</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((p, idx) => (
                    <tr key={p.userId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 px-2 py-1 text-center text-gray-600">{idx + 1}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">{formatAffiliation(p)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">{p.position || p.userType}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center font-medium">{p.name}</td>
                      <td
                        className="border border-gray-400 px-1 py-1 text-center"
                        style={{ minHeight: '56px', height: '56px' }}
                      >
                        {p.signature ? (
                          <img
                            src={p.signature.signatureImage}
                            alt="서명"
                            className="max-h-12 mx-auto object-contain"
                          />
                        ) : p.userId === currentUserId ? (
                          <button
                            onClick={() => setSigningUserId(p.userId)}
                            className="text-xs text-blue-600 hover:underline no-print"
                          >
                            서명하기
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">미서명</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="border border-gray-400 px-1 py-1 text-center no-print">
                          {p.signature && (
                            <button
                              onClick={() => setDeleteConfirm(p.userId)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 하단 확인란 */}
              <div className="mt-4 flex justify-end">
                <table className="text-sm border border-gray-400" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <th className="bg-gray-100 border border-gray-400 px-4 py-2 font-semibold">총 인원</th>
                      <td className="border border-gray-400 px-6 py-2 text-center">{totalCount}명</td>
                      <th className="bg-gray-100 border border-gray-400 px-4 py-2 font-semibold">서명 완료</th>
                      <td className="border border-gray-400 px-6 py-2 text-center">{signedCount}명</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* 서명 모달 */}
      {signingUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">전자서명</h2>
            <p className="text-sm text-gray-500 mb-4">아래 공간에 서명해 주세요. 마우스나 손가락으로 서명하세요.</p>
            <SignaturePad ref={signaturePadRef} />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => signaturePadRef.current?.clear()}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                지우기
              </button>
              <button
                type="button"
                onClick={() => { setSigningUserId(null) }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? '저장 중...' : '서명 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 서명 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">서명 삭제</h3>
            <p className="text-gray-600 mb-4">이 서명을 삭제하시겠습니까? 삭제하면 다시 서명해야 합니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default SignatureBookDetail
