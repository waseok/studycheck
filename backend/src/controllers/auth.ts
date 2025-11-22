import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'

const INITIAL_PASSWORD = process.env.SCHOOL_PASSWORD || '1234'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin-password'
const DEFAULT_DEV_SECRET = 'unified-dev-secret-2025'
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET

type AppRole = 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER'

// 초기 비밀번호로 로그인 (PIN 설정 전용)
export const loginInitial = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' })
    }

    const initialPassword = process.env.SCHOOL_PASSWORD || '1234'

    if (password !== initialPassword) {
      return res.status(401).json({ error: '잘못된 초기 비밀번호입니다.' })
    }

    // DB에서 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(404).json({ error: '등록되지 않은 이메일입니다.' })
    }

    // PIN이 이미 설정되어 있으면 초기 비번 로그인 불가
    if (user.pinHash && !user.mustSetPin) {
      return res.status(403).json({ error: '이미 PIN이 설정되었습니다. PIN으로 로그인해주세요.' })
    }

    // 역할 결정
    const role: AppRole = (user.role as AppRole) || (user.isAdmin ? 'SUPER_ADMIN' : 'USER')

    // PIN 설정이 필요한 경우 토큰 발급 (mustSetPin=true)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role, isAdmin: user.isAdmin, mustSetPin: user.mustSetPin, loginTime: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      mustSetPin: user.mustSetPin,
      role,
      isAdmin: user.isAdmin,
      message: user.mustSetPin ? 'PIN을 설정해주세요.' : '로그인되었습니다.'
    })
  } catch (error) {
    console.error('Initial login error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

// PIN 설정
export const setPin = async (req: Request, res: Response) => {
  try {
    const { pin } = req.body as { pin?: string }
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' })
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: '4자리 숫자 PIN을 입력해주세요.' })
    }

    // PIN 해시화
    const pinHash = await bcrypt.hash(pin, 10)

    // 사용자 업데이트
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        pinHash,
        mustSetPin: false
      }
    })

    // 역할 결정
    const role: AppRole = (user.role as AppRole) || (user.isAdmin ? 'SUPER_ADMIN' : 'USER')

    // 새 토큰 발급 (mustSetPin=false)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role, isAdmin: user.isAdmin, mustSetPin: false, loginTime: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      message: 'PIN이 설정되었습니다.'
    })
  } catch (error) {
    console.error('Set PIN error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

// PIN으로 로그인
export const loginPin = async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body as { email?: string; pin?: string }

    if (!email || !pin) {
      return res.status(400).json({ error: '이메일과 PIN을 입력해주세요.' })
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: '4자리 숫자 PIN을 입력해주세요.' })
    }

    // DB에서 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(404).json({ error: '등록되지 않은 이메일입니다.' })
    }

    if (!user.pinHash) {
      return res.status(403).json({ error: 'PIN이 설정되지 않았습니다. 초기 비밀번호로 로그인해주세요.' })
    }

    // PIN 검증
    const isValid = await bcrypt.compare(pin, user.pinHash)

    if (!isValid) {
      return res.status(401).json({ error: '잘못된 PIN입니다.' })
    }

    // 역할 결정
    const role: AppRole = (user.role as AppRole) || (user.isAdmin ? 'SUPER_ADMIN' : 'USER')

    // 토큰 발급
    const token = jwt.sign(
      { userId: user.id, email: user.email, role, isAdmin: user.isAdmin, mustSetPin: user.mustSetPin, loginTime: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      role,
      isAdmin: user.isAdmin,
      mustSetPin: user.mustSetPin,
      message: '로그인되었습니다.'
    })
  } catch (error) {
    console.error('PIN login error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

// 기존 login 함수는 호환성을 위해 유지 (관리자용)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }

    if (!password) {
      return res.status(400).json({ error: '비밀번호를 입력해주세요.' })
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin-password'

    if (password !== adminPassword) {
      return res.status(401).json({ error: '잘못된 비밀번호입니다.' })
    }

    // 관리자 비번이면 SUPER_ADMIN
    const role: AppRole = 'SUPER_ADMIN'

    const token = jwt.sign(
      { isAdmin: true, role, email: email || null, loginTime: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      isAdmin: true,
      role,
      message: '관리자로 로그인되었습니다.'
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

