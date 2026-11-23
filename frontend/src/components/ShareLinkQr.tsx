import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface ShareLinkQrProps {
  url: string
  title: string
}

const QR_SIZE = 720
const LOGO_RATIO = 0.22

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

const ShareLinkQr = ({ url, title }: ShareLinkQrProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    const draw = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      // 오류 정정 H(30%)라 가운데를 교표로 가려도 스캔된다
      await QRCode.toCanvas(canvas, url, { errorCorrectionLevel: 'H', width: QR_SIZE, margin: 2 })
      // 라이브러리가 인라인으로 넣는 720px 크기를 덮어써서 화면에서는 모달 폭에 맞춘다 (다운로드는 내부 해상도 그대로)
      canvas.style.width = '100%'
      canvas.style.height = 'auto'
      try {
        const logo = await loadImage('/school-logo.png')
        if (cancelled) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const box = QR_SIZE * LOGO_RATIO
        const pad = box * 0.12
        const cx = QR_SIZE / 2
        const cy = QR_SIZE / 2
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(cx, cy, box / 2 + pad, 0, Math.PI * 2)
        ctx.fill()
        const ratio = logo.width / logo.height
        const w = ratio >= 1 ? box : box * ratio
        const h = ratio >= 1 ? box / ratio : box
        ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h)
      } catch {
        // 교표를 불러오지 못해도 QR 자체는 정상 사용 가능
      }
      if (!cancelled) setReady(true)
    }
    draw().catch(() => {})
    return () => { cancelled = true }
  }, [url])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${title.replace(/[\\/:*?"<>|]/g, '_')}_QR.png`
    link.click()
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-700">QR 코드</div>
      <div className="w-full max-w-[288px] mx-auto">
        <canvas ref={canvasRef} className="block rounded-lg border border-gray-200" />
      </div>
      <button
        onClick={handleDownload}
        disabled={!ready}
        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        QR 코드 다운로드
      </button>
    </div>
  )
}

export default ShareLinkQr
