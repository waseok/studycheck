import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginInitial, loginPin, login, register } from '../api/auth'
import GoogleLoginButton from '../components/GoogleLoginButton'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const Login = () => {
  const [activeTab, setActiveTab] = useState<'initial' | 'pin' | 'admin'>('pin')
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('savedEmail') || ''
  })
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('savedPassword') || ''
  })
  const [adminPassword, setAdminPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true'
  })
  const [showRegister, setShowRegister] = useState(false)
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    userType: '교원',
    position: '',
    grade: '',
    class: ''
  })
  const [registerLoading, setRegisterLoading] = useState(false)
  const navigate = useNavigate()

  const userTypes = ['교원', '직원', '공무직', '기간제교사', '교육공무직', '교직원', '교육활동 참여자']
  const hasGoogleClientId = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim() !== ''

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginInitial(email, password)
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        if (!savedToken) {
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        if (rememberMe) {
          localStorage.setItem('savedEmail', email)
          localStorage.setItem('savedPassword', password)
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('savedEmail')
          localStorage.removeItem('savedPassword')
          localStorage.removeItem('rememberMe')
        }
        
        if (result.mustSetPin) {
          navigate('/set-pin')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(result.message || '로그인에 실패했습니다.')
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.status) {
        setError(`서버 오류가 발생했습니다. (${err.response.status})`)
      } else {
        setError(err.message || '로그인 중 오류가 발생했습니다.')
      }
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
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        if (!savedToken) {
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        if (rememberMe) {
          localStorage.setItem('savedEmail', email)
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('savedEmail')
          localStorage.removeItem('savedPassword')
          localStorage.removeItem('rememberMe')
        }
        
        if (result.mustSetPin) {
          navigate('/set-pin')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(result.message || '로그인에 실패했습니다.')
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.status) {
        setError(`서버 오류가 발생했습니다. (${err.response.status})`)
      } else {
        setError(err.message || '로그인 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email && email.trim() ? email.trim() : '', adminPassword)
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        const savedRole = localStorage.getItem('role')
        
        if (!savedToken) {
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        if (!savedRole || savedRole !== 'SUPER_ADMIN') {
          localStorage.setItem('role', 'SUPER_ADMIN')
          localStorage.setItem('isAdmin', 'true')
        }
        
        navigate('/dashboard')
      } else {
        setError(result.message || '로그인에 실패했습니다.')
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.status) {
        setError(`서버 오류가 발생했습니다. (${err.response.status})`)
      } else {
        setError(err.message || '로그인 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setRegisterLoading(true)

    try {
      const result = await register(registerData)
      if (result.success) {
        alert('회원가입이 완료되었습니다. 초기 비밀번호(1234)로 로그인하여 PIN을 설정해주세요.')
        setShowRegister(false)
        setRegisterData({ name: '', email: '', userType: '교원', position: '', grade: '', class: '' })
        setActiveTab('initial')
        setEmail(registerData.email)
      } else {
        setError(result.message || '회원가입에 실패했습니다.')
      }
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            와석초 의무연수 안내 취합 통합 플랫폼
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border-2 border-gray-400 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border-2 border-gray-400 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="4자리 PIN을 입력하세요"
              />
            </div>
            <div className="flex items-center">
              <input
                id="remember-pin"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-pin" className="ml-2 block text-sm text-gray-900">
                아이디 저장
              </label>
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border-2 border-gray-400 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border-2 border-gray-400 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="초기 비밀번호를 입력하세요"
              />
            </div>
            <div className="flex items-center">
              <input
                id="remember-initial"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-initial" className="ml-2 block text-sm text-gray-900">
                아이디/비밀번호 저장
              </label>
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border-2 border-gray-400 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border-2 border-gray-400 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="관리자 비밀번호를 입력하세요"
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

        {/* Google 로그인 버튼 */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">또는</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {hasGoogleClientId && (
              <GoogleLoginButton
                onError={setError}
                onLoadingChange={setLoading}
              />
            )}
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-indigo-600 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>

      {/* 회원가입 모달 */}
      {showRegister && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">회원가입</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-gray-700">
                  이름 *
                </label>
                <input
                  id="register-name"
                  type="text"
                  required
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
                  이메일 (ID) *
                </label>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="register-userType" className="block text-sm font-medium text-gray-700">
                  유형 *
                </label>
                <select
                  id="register-userType"
                  required
                  value={registerData.userType}
                  onChange={(e) => setRegisterData({ ...registerData, userType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {userTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="register-position" className="block text-sm font-medium text-gray-700">
                  직위 (선택사항)
                </label>
                <input
                  id="register-position"
                  type="text"
                  value={registerData.position}
                  onChange={(e) => setRegisterData({ ...registerData, position: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="직위를 입력하세요"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="register-grade" className="block text-sm font-medium text-gray-700">
                    학년 (선택사항)
                  </label>
                  <input
                    id="register-grade"
                    type="text"
                    value={registerData.grade}
                    onChange={(e) => setRegisterData({ ...registerData, grade: e.target.value })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="학년"
                  />
                </div>
                <div>
                  <label htmlFor="register-class" className="block text-sm font-medium text-gray-700">
                    반 (선택사항)
                  </label>
                  <input
                    id="register-class"
                    type="text"
                    value={registerData.class}
                    onChange={(e) => setRegisterData({ ...registerData, class: e.target.value })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="반"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  회원가입 후 초기 비밀번호(1234)로 로그인하여 PIN을 설정해주세요.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(false)
                    setError('')
                    setRegisterData({ name: '', email: '', userType: '교원', position: '', grade: '', class: '' })
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-400 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerLoading ? '가입 중...' : '가입하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
