import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import SignaturePadLib from 'signature_pad'

export interface SignaturePadRef {
  isEmpty: () => boolean
  clear: () => void
  toDataURL: () => string
  loadDataURL: (dataURL: string) => void
}

const SignaturePad = forwardRef<SignaturePadRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(ratio, ratio)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    }

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1.5,
      maxWidth: 3,
    })

    return () => {
      padRef.current?.off()
    }
  }, [])

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    clear: () => {
      padRef.current?.clear()
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
        }
      }
    },
    toDataURL: () => padRef.current?.toDataURL('image/png') ?? '',
    loadDataURL: (dataURL: string) => {
      if (padRef.current) {
        padRef.current.fromDataURL(dataURL)
      }
    },
  }))

  return (
    <canvas
      ref={canvasRef}
      className="border-2 border-gray-300 rounded-lg w-full touch-none bg-white cursor-crosshair"
      style={{ height: '200px', display: 'block' }}
    />
  )
})

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
