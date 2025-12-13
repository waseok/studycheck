import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginInitial, loginPin, login, register } from '../api/auth'
import GoogleLoginButton from '../components/GoogleLoginButton'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const Login = () => {
  const [activeTab, setActiveTab] = useState<'initial' | 'pin' | 'admin'>('pin')
  const [email, setEmail] = useState(() => {
    // 저장된 이메일 불러오기
    return localStorage.getItem('savedEmail') || ''
  })
  const [password, setPassword] = useState(() => {
    // 저장된 비밀번호 불러오기 (보안을 위해 암호화 고려, 현재는 평문 저장)
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
      console.log('🔐 초기 비번 로그인 결과:', result)
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        if (!savedToken) {
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        // 아이디/비밀번호 저장 처리
        if (rememberMe) {
          localStorage.setItem('savedEmail', email)
          localStorage.setItem('savedPassword', password)
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('savedEmail')
          localStorage.removeItem('savedPassword')
          localStorage.removeItem('rememberMe')
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
      console.log('🔐 PIN 로그인 결과:', result)
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        if (!savedToken) {
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        // 아이디 저장 처리 (PIN 로그인은 이메일만 저장)
        if (rememberMe) {
          localStorage.setItem('savedEmail', email)
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('savedEmail')
          localStorage.removeItem('savedPassword')
          localStorage.removeItem('rememberMe')
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:83',message:'관리자 로그인 시작',data:{email:email||'없음',hasAdminPassword:!!adminPassword,adminPasswordLength:adminPassword.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      // 관리자 로그인은 이메일이 선택사항이므로, 빈 문자열 대신 undefined 전달
      const result = await login(email && email.trim() ? email.trim() : '', adminPassword)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:90',message:'관리자 로그인 API 응답 수신',data:{success:result.success,hasToken:!!result.token,isAdmin:result.isAdmin,role:result.role,message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.log('🔐 관리자 로그인 결과:', result)
      
      if (result.success) {
        const savedToken = localStorage.getItem('token')
        const savedIsAdmin = localStorage.getItem('isAdmin')
        const savedRole = localStorage.getItem('role')
        
        // 디버깅: 저장된 값 확인
        console.log('🔐 관리자 로그인 성공 - 저장된 값:', {
          hasToken: !!savedToken,
          isAdmin: savedIsAdmin,
          role: savedRole,
          resultIsAdmin: result.isAdmin,
          resultRole: result.role,
        })
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:94',message:'토큰 저장 확인',data:{hasSavedToken:!!savedToken,savedIsAdmin,savedRole},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        if (!savedToken) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:95',message:'토큰 저장 실패',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          setError('토큰 저장에 실패했습니다.')
          setLoading(false)
          return
        }
        
        // role이 제대로 저장되었는지 확인
        if (!savedRole || savedRole !== 'SUPER_ADMIN') {
          console.warn('⚠️ role이 제대로 저장되지 않음:', { savedRole, expected: 'SUPER_ADMIN' })
          // role을 다시 설정
          localStorage.setItem('role', 'SUPER_ADMIN')
          localStorage.setItem('isAdmin', 'true')
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:101',message:'대시보드로 이동 전',data:{token:localStorage.getItem('token')?.substring(0,20)+'...',isAdmin:localStorage.getItem('isAdmin'),role:localStorage.getItem('role')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        console.log('✅ 대시보드로 이동:', {
          finalIsAdmin: localStorage.getItem('isAdmin'),
          finalRole: localStorage.getItem('role'),
        })
        
        // 관리자는 바로 대시보드로 이동
        navigate('/dashboard')
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:103',message:'로그인 실패',data:{message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setError(result.message || '로그인에 실패했습니다.')
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:106',message:'관리자 로그인 예외 발생',data:{error:err?.message,responseError:err?.response?.data?.error,status:err?.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('❌ 관리자 로그인 에러:', err)
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
      console.error('❌ 회원가입 에러:', err)
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
