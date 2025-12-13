import axios from 'axios'

// Vite 프록시를 사용하거나 직접 백엔드 URL 사용
// 개발 환경에서는 프록시 대신 백엔드로 직접 요청하여 헤더 전달 문제를 회피
// 프로덕션에서는 환경 변수가 없으면 기본 백엔드 URL 사용
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://studycheck.onrender.com/api')

// 디버깅: API URL 로그
if (typeof window !== 'undefined') {
  console.log('🔗 API URL:', API_URL)
  console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('🔗 NODE_ENV:', import.meta.env.MODE)
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// 요청 인터셉터: 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰 가져오기
    let token: string | null = null
    try {
      token = localStorage.getItem('token')
    } catch (error) {
      console.error('localStorage 접근 오류:', error)
    }
    
    // #region agent log
    if (config.url?.includes('/auth/') || config.url?.includes('/users') || config.url?.includes('/trainings') || config.url?.includes('/stats')) {
      fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:16',message:'API 요청 인터셉터',data:{url:config.url,method:config.method,hasToken:!!token,tokenLength:token?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    }
    // #endregion
    
    // 헤더 객체가 없으면 생성
    if (!config.headers) {
      config.headers = {} as any
    }
    
    // 토큰이 있으면 Authorization 헤더에 추가
    if (token) {
      // axios 타입 문제를 우회하여 헤더 설정
      const headers = config.headers as any
      headers['Authorization'] = `Bearer ${token}`
      headers.Authorization = `Bearer ${token}`
      
      // CommonHeaders 타입으로도 설정
      if ((config.headers as any).common) {
        (config.headers.common as any)['Authorization'] = `Bearer ${token}`
      }
      
      // #region agent log
      if (config.url?.includes('/auth/') || config.url?.includes('/users') || config.url?.includes('/trainings') || config.url?.includes('/stats')) {
        fetch('http://127.0.0.1:7242/ingest/e741cc26-0c96-49fc-9dc9-8cc71ca2bc2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:31',message:'Authorization 헤더 설정 완료',data:{url:config.url,hasAuthHeader:!!headers.Authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터: 에러 처리
let isRedirecting = false

apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답도 로깅 (디버깅용)
    if (import.meta.env.DEV && (response.config?.url?.includes('/trainings') || response.config?.url?.includes('/users') || response.config?.url?.includes('/participants'))) {
      console.log('✅ API 성공:', {
        url: response.config?.url,
        method: response.config?.method,
        status: response.status,
      })
    }
    return response
  },
  (error) => {
    // 디버깅용 (모든 환경에서)
    console.error('❌ API 에러 발생:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
      method: error.config?.method,
      hasToken: !!localStorage.getItem('token'),
      currentPath: window.location.pathname,
      errorCode: error.code,
      errorMessage: error.message,
    })

    // 401 에러 처리 (인증 실패) — 원래 동작: 토큰 제거 후 로그인 페이지로 이동
    if (error.response?.status === 401 && !isRedirecting) {
      console.error('🚨 401 인증 실패 상세 정보:', {
        url: error.config?.url,
        method: error.config?.method,
        requestHeaders: error.config?.headers,
        hasTokenInStorage: !!localStorage.getItem('token'),
        tokenValue: localStorage.getItem('token')?.substring(0, 30) + '...',
        responseError: error.response?.data,
      })

      if (window.location.pathname !== '/login') {
        isRedirecting = true
        localStorage.removeItem('token')
        localStorage.removeItem('isAdmin')
        setTimeout(() => { window.location.href = '/login' }, 100)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
