import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPin } from '../api/auth'

const SetPin = () => {
  const [pin, setPinValue] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (pin.length !== 4) {
      setError('PIN은 4자리 숫자여야 합니다.')
      return
    }

    if (pin !== confirmPin) {
      setError('PIN이 일치하지 않습니다.')
      return
    }

    // 간단한 검증: 같은 숫자 4개는 허용하지 않음
    if (/^(\d)\1{3}$/.test(pin)) {
      setError('같은 숫자 4개는 사용할 수 없습니다.')
      return
    }

    setLoading(true)

    try {
      const result = await setPin(pin)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.message || 'PIN 설정에 실패했습니다.')
      }
    } catch (err: any) {
      console.error('PIN 설정 에러:', err)
      setError(err.response?.data?.error || 'PIN 설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            PIN 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            4자리 숫자 PIN을 설정해주세요
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
              PIN (4자리 숫자)
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPinValue(value)
              }}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="0000"
            />
          </div>
          <div>
            <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700">
              PIN 확인
            </label>
            <input
              id="confirmPin"
              name="confirmPin"
              type="password"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              value={confirmPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                setConfirmPin(value)
              }}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="0000"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '설정 중...' : 'PIN 설정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SetPin

