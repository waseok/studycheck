interface CompletionDonutProps {
  completed: number
  pending: number
  size?: number
}

const CompletionDonut = ({ completed, pending, size = 96 }: CompletionDonutProps) => {
  const total = completed + pending
  const completedRatio = total > 0 ? completed / total : 0
  const completedDeg = Math.max(0, Math.min(360, completedRatio * 360))

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(#34d399 0deg ${completedDeg}deg, #fb923c ${completedDeg}deg 360deg)`,
        }}
      />
      <div
        className="absolute rounded-full bg-white flex items-center justify-center text-xs font-semibold text-gray-700"
        style={{ width: size * 0.58, height: size * 0.58 }}
      >
        {Math.round(completedRatio * 100)}%
      </div>
    </div>
  )
}

export default CompletionDonut
