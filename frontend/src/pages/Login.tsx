import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginInitial, loginPin, login } from '../api/auth'

const Login = () => {
  const [activeTab, setActiveTab] = useState<'initial' | 'pin' | 'admin'>('pin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginInitial(email, password)
      console.log('🔐 초기 비번 로그인 결과:', result)
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        if (!savedToken) {
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        // PIN 설정이 필요한 경우 PIN 설정 페이지로 이동
        if (result.mustSetPin) {
          navigate('/set-pin')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(result.message || '로그인에 실패했습니다.')
      }
    } catch (err: any) {
      console.error('❌ 로그인 에러:', err)
      setError(err.response?.data?.error || '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginPin(email, pin)
      console.log('🔐 PIN 로그인 결과:', result)
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        if (!savedToken) {
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        // PIN 설정이 필요한 경우 PIN 설정 페이지로 이동
        if (result.mustSetPin) {
          navigate('/set-pin')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(result.message || '로그인에 실패했습니다.')
      }
    } catch (err: any) {
      console.error('❌ 로그인 에러:', err)
      setError(err.response?.data?.error || '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email || '', adminPassword)
      console.log('🔐 관리자 로그인 결과:', result)
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        if (!savedToken) {
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        // 관리자는 바로 대시보드로 이동
        navigate('/dashboard')
      } else {
        setError(result.message || '로그인에 실패했습니다.')
      }
    } catch (err: any) {
      console.error('❌ 관리자 로그인 에러:', err)
      setError(err.response?.data?.error || '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            의무연수 안내 취합 통합 플랫폼
          </h2>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => { setActiveTab('pin'); setError('') }}
            className={`flex-1 py-2 px-4 text-center font-medium text-sm ${
              activeTab === 'pin'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            PIN 로그인
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('initial'); setError('') }}
            className={`flex-1 py-2 px-4 text-center font-medium text-sm ${
              activeTab === 'initial'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            초기 비밀번호 설정
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError('') }}
            className={`flex-1 py-2 px-4 text-center font-medium text-sm ${
              activeTab === 'admin'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            관리자
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* PIN 로그인 폼 */}
        {activeTab === 'pin' && (
          <form className="mt-8 space-y-6" onSubmit={handlePinLogin}>
            <div>
              <label htmlFor="email-pin" className="sr-only">이메일</label>
              <input
                id="email-pin"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="이메일을 입력하세요"
              />
            </div>
            <div>
              <label htmlFor="pin" className="sr-only">PIN</label>
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
                  setPin(value)
                }}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="4자리 PIN을 입력하세요"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>
        )}

        {/* 초기 비밀번호 로그인 폼 */}
        {activeTab === 'initial' && (
          <form className="mt-8 space-y-6" onSubmit={handleInitialLogin}>
            <div>
              <label htmlFor="email-initial" className="sr-only">이메일</label>
              <input
                id="email-initial"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="이메일을 입력하세요"
              />
            </div>
            <div>
              <label htmlFor="password-initial" className="sr-only">초기 비밀번호</label>
              <input
                id="password-initial"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="초기 비밀번호를 입력하세요 (1234)"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>
        )}

        {/* 관리자 로그인 폼 */}
        {activeTab === 'admin' && (
          <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800 font-medium">관리자 로그인</p>
              <p className="text-xs text-red-600 mt-1">관리자 비밀번호를 입력하세요 (이메일은 선택사항입니다)</p>
            </div>
            <div>
              <label htmlFor="email-admin" className="sr-only">이메일 (선택사항)</label>
              <input
                id="email-admin"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="이메일 (선택사항)"
              />
            </div>
            <div>
              <label htmlFor="password-admin" className="sr-only">관리자 비밀번호</label>
              <input
                id="password-admin"
                name="adminPassword"
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="관리자 비밀번호를 입력하세요 (8714)"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '관리자 로그인'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
