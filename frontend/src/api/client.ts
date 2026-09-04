import axios, { InternalAxiosRequestConfig } from 'axios'

// Vite 프록시를 사용하거나 직접 백엔드 URL 사용
// 개발 환경에서는 프록시 대신 백엔드로 직접 요청하여 헤더 전달 문제를 회피
// 프로덕션에서는 환경 변수가 없으면 기본 백엔드 URL 사용
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://studycheck.onrender.com/api')

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 60000, // 60초 타임아웃 (절전 모드에서 서버 깨어나는 시간 고려)
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
    
    // 헤더 객체가 없으면 생성
    if (!config.headers) {
      config.headers = {} as any
    }
    
    // 토큰이 있으면 Authorization 헤더에 추가
    if (token) {
      const headers = config.headers as any
      headers['Authorization'] = `Bearer ${token}`
      headers.Authorization = `Bearer ${token}`
      
      if ((config.headers as any).common) {
        (config.headers.common as any)['Authorization'] = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터: 에러 처리
let isRedirecting = false
const GET_RETRY_DELAYS_MS = [1000, 3000]
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504])

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _getRetryCount?: number
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableRequestConfig | undefined
    const method = config?.method?.toLowerCase()
    const status = error.response?.status as number | undefined
    const retryCount = config?._getRetryCount ?? 0
    const isNetworkError = !error.response && !axios.isCancel(error)
    const isTemporaryServerError = status != null && RETRYABLE_STATUS_CODES.has(status)

    // 조회 요청만 최대 2회 재시도합니다.
    // 생성·수정·삭제 요청은 중복 처리 위험이 있어 재시도하지 않습니다.
    if (
      config &&
      method === 'get' &&
      retryCount < GET_RETRY_DELAYS_MS.length &&
      (isNetworkError || isTemporaryServerError)
    ) {
      const delay = GET_RETRY_DELAYS_MS[retryCount]
      config._getRetryCount = retryCount + 1
      console.warn(`API 조회 재시도 ${config._getRetryCount}/${GET_RETRY_DELAYS_MS.length} (${delay}ms 후)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return apiClient.request(config)
    }

    // 401 에러 처리 (인증 실패)
    if (error.response?.status === 401 && !isRedirecting) {
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
