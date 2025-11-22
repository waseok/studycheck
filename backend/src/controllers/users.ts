import { Request, Response } from 'express'
import * as XLSX from 'xlsx'
import prisma from '../utils/prisma'

type AppRole = 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER'

const applyRoleMapping = (role?: AppRole) => {
  if (!role) return {}
  if (role === 'SUPER_ADMIN') return { isAdmin: true }
  if (role === 'TRAINING_ADMIN') return { isAdmin: false }
  return { isAdmin: false }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: '교직원 목록 조회 중 오류가 발생했습니다.' })
  }
}

export const createUser = async (req: Request, res: Response) => {
  try {
    console.log('📥 Create user request received:', {
      body: req.body,
      headers: { 'content-type': req.headers['content-type'] },
      method: req.method,
      path: req.path,
    })
    
    const { name, email, userType, role } = req.body as { name: string; email: string; userType?: string; role?: AppRole }

    console.log('➕ Create user parsed:', { name, email, userType, role })

    // 입력 검증
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: '이름은 필수입니다.' })
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: '이메일은 필수입니다.' })
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '올바른 이메일 형식이 아닙니다.' })
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() }
    })

    if (existingUser) {
      return res.status(400).json({ error: '이미 등록된 이메일입니다.' })
    }

    // role 검증
    const validRoles: AppRole[] = ['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']
    const finalRole = role && validRoles.includes(role) ? role : 'USER'
    const roleData = applyRoleMapping(finalRole)

    // userType 검증 및 설정
    const validUserTypes = ['교원', '직원', '공무직', '기간제교사', '교육공무직', '교직원']
    const finalUserType = userType && validUserTypes.includes(userType) ? userType : '교직원'

    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      userType: finalUserType,
      isAdmin: roleData?.isAdmin === true ? true : false,
      role: finalRole,
      mustSetPin: true, // 새 사용자는 PIN 설정 필요
    }

    console.log('➕ Creating user with data:', JSON.stringify(userData, null, 2))

    try {
      const user = await prisma.user.create({
        data: userData
      })

      console.log('✅ User created successfully:', user.id)
      res.status(201).json(user)
    } catch (prismaError: any) {
      console.error('❌ Prisma create error:', prismaError)
      console.error('❌ Prisma error code:', prismaError?.code)
      console.error('❌ Prisma error meta:', JSON.stringify(prismaError?.meta, null, 2))
      throw prismaError // 상위 catch로 전달
    }
  } catch (error: any) {
    console.error('❌ Create user error:', error)
    console.error('❌ Error stack:', error?.stack)
    console.error('❌ Error code:', error?.code)
    console.error('❌ Error meta:', error?.meta)
    
    const errorMessage = error?.message || '알 수 없는 오류'
    console.error('❌ Error details:', errorMessage)
    
    // Prisma 관련 오류 처리
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || '필드'
      return res.status(400).json({ error: `이미 등록된 ${field === 'email' ? '이메일' : field}입니다.` })
    }
    
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: '데이터를 찾을 수 없습니다.' })
    }

    // 더 자세한 에러 메시지 반환 (개발 모드에서는 상세 정보 포함)
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
    let detailedError = '교직원 등록 중 오류가 발생했습니다.'
    
    if (isDev) {
      detailedError = `교직원 등록 중 오류가 발생했습니다: ${errorMessage}`
      if (error?.code) {
        detailedError += ` (코드: ${error.code})`
      }
      if (error?.meta) {
        detailedError += ` [상세: ${JSON.stringify(error.meta)}]`
      }
    }
    
    console.error('❌ 최종 에러 응답:', detailedError)
    res.status(500).json({ error: detailedError })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, email, userType, role } = req.body as { name?: string; email?: string; userType?: string; role?: AppRole }

    console.log('📝 Update user request:', { id, name, email, userType, role })

    // 업데이트할 데이터가 없으면 오류
    if (!name && !email && !userType && !role) {
      return res.status(400).json({ error: '수정할 정보가 없습니다.' })
    }

    // 사용자가 존재하는지 확인
    const existingUserById = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUserById) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    // 이메일 변경 시 중복 확인
    if (email && email !== existingUserById.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      })

      if (existingUser) {
        return res.status(400).json({ error: '이미 등록된 이메일입니다.' })
      }
    }

    const roleData = applyRoleMapping(role)

    // 업데이트할 데이터 준비
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (userType !== undefined) updateData.userType = userType
    if (role !== undefined) {
      updateData.role = role
      updateData.isAdmin = roleData.isAdmin ?? false
    }

    console.log('📝 Update data:', updateData)

    // 업데이트할 데이터가 없으면 원래 데이터 반환
    if (Object.keys(updateData).length === 0) {
      return res.json(existingUserById)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    console.log('✅ User updated successfully:', user.id)
    res.json(user)
  } catch (error: any) {
    console.error('❌ Update user error:', error)
    console.error('❌ Error stack:', error?.stack)
    const errorMessage = error?.message || '알 수 없는 오류'
    console.error('❌ Error details:', errorMessage)
    
    // Prisma 관련 오류 처리
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }
    
    res.status(500).json({ error: `교직원 정보 수정 중 오류가 발생했습니다: ${errorMessage}` })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.user.delete({
      where: { id }
    })

    res.json({ success: true, message: '교직원이 삭제되었습니다.' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: '교직원 삭제 중 오류가 발생했습니다.' })
  }
}

export const resetUserPin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // PIN 초기화: pinHash 제거, mustSetPin=true로 설정
    await prisma.user.update({
      where: { id },
      data: {
        pinHash: null,
        mustSetPin: true
      }
    })

    res.json({ success: true, message: 'PIN이 초기화되었습니다. 사용자는 초기 비밀번호로 로그인하여 PIN을 다시 설정해야 합니다.' })
  } catch (error) {
    console.error('Reset PIN error:', error)
    res.status(500).json({ error: 'PIN 초기화 중 오류가 발생했습니다.' })
  }
}

// 엑셀 일괄 등록
export const bulkCreateUsers = async (req: Request, res: Response) => {
  try {
    // multer가 업로드한 파일 정보는 req.file에 있음
    const file = (req as any).file
    
    if (!file) {
      return res.status(400).json({ error: '엑셀 파일을 업로드해주세요.' })
    }

    console.log('📊 엑셀 파일 업로드:', file.originalname)

    // 엑셀 파일 읽기
    const workbook = XLSX.read(file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    console.log('📊 엑셀 데이터:', data.length, '행')

    // 첫 번째 행은 헤더 (이름, 이메일, 유형, 권한)
    if (data.length < 2) {
      return res.status(400).json({ error: '엑셀 파일에 데이터가 없습니다. 최소 2행(헤더 + 데이터 1행)이 필요합니다.' })
    }

    const headers = data[0].map((h: any) => String(h).trim().toLowerCase())
    console.log('📊 엑셀 헤더:', headers)

    // 헤더 검증
    const requiredHeaders = ['이름', '이메일', '유형', '권한']
    const headerMapping: { [key: string]: string } = {
      '이름': 'name',
      '이메일': 'email',
      '유형': 'userType',
      '권한': 'role'
    }

    // 헤더 인덱스 찾기
    const headerIndices: { [key: string]: number } = {}
    requiredHeaders.forEach(header => {
      const index = headers.findIndex(h => h === header.toLowerCase())
      if (index === -1) {
        return res.status(400).json({ error: `필수 헤더가 없습니다: ${header}` })
      }
      headerIndices[headerMapping[header]] = index
    })

    const validUserTypes = ['교원', '직원', '공무직', '기간제교사', '교육공무직', '교직원']
    const validRoles: { [key: string]: AppRole } = {
      '최고 관리자': 'SUPER_ADMIN',
      '연수 관리자': 'TRAINING_ADMIN',
      '일반 사용자': 'USER',
      'SUPER_ADMIN': 'SUPER_ADMIN',
      'TRAINING_ADMIN': 'TRAINING_ADMIN',
      'USER': 'USER'
    }

    // 데이터 검증 및 변환
    const usersToCreate: Array<{
      name: string
      email: string
      userType: string
      role: AppRole
      isAdmin: boolean
      mustSetPin: boolean
    }> = []

    const errors: string[] = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1

      // 빈 행 건너뛰기
      if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
        continue
      }

      const name = String(row[headerIndices.name] || '').trim()
      const email = String(row[headerIndices.email] || '').trim().toLowerCase()
      const userType = String(row[headerIndices.userType] || '').trim()
      const roleText = String(row[headerIndices.role] || '').trim()

      // 검증
      if (!name) {
        errors.push(`${rowNum}행: 이름이 없습니다.`)
        continue
      }

      if (!email) {
        errors.push(`${rowNum}행: 이메일이 없습니다.`)
        continue
      }

      if (!emailRegex.test(email)) {
        errors.push(`${rowNum}행: 올바른 이메일 형식이 아닙니다: ${email}`)
        continue
      }

      if (userType && !validUserTypes.includes(userType)) {
        errors.push(`${rowNum}행: 유효하지 않은 유형입니다: ${userType} (허용: ${validUserTypes.join(', ')})`)
        continue
      }

      const finalUserType = userType && validUserTypes.includes(userType) ? userType : '교직원'
      
      if (!roleText) {
        errors.push(`${rowNum}행: 권한이 없습니다.`)
        continue
      }

      const role = validRoles[roleText]
      if (!role) {
        errors.push(`${rowNum}행: 유효하지 않은 권한입니다: ${roleText} (허용: 최고 관리자, 연수 관리자, 일반 사용자)`)
        continue
      }

      const roleData = applyRoleMapping(role)

      usersToCreate.push({
        name,
        email,
        userType: finalUserType,
        role,
        isAdmin: roleData.isAdmin === true,
        mustSetPin: true
      })
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: '엑셀 파일에 오류가 있습니다.',
        details: errors
      })
    }

    if (usersToCreate.length === 0) {
      return res.status(400).json({ error: '등록할 교직원 데이터가 없습니다.' })
    }

    console.log(`📊 ${usersToCreate.length}명의 교직원 등록 시작`)

    // 기존 이메일 중복 확인
    const existingEmails = await prisma.user.findMany({
      where: {
        email: {
          in: usersToCreate.map(u => u.email)
        }
      },
      select: { email: true }
    })

    const existingEmailSet = new Set(existingEmails.map(u => u.email))
    const duplicateEmails = usersToCreate.filter(u => existingEmailSet.has(u.email))

    if (duplicateEmails.length > 0) {
      return res.status(400).json({
        error: '이미 등록된 이메일이 있습니다.',
        details: duplicateEmails.map(u => `${u.name} (${u.email})`).join(', ')
      })
    }

    // 일괄 등록
    const results = await prisma.$transaction(
      usersToCreate.map(userData =>
        prisma.user.create({
          data: userData
        })
      )
    )

    console.log(`✅ ${results.length}명의 교직원 등록 완료`)

    res.json({
      success: true,
      message: `${results.length}명의 교직원이 등록되었습니다.`,
      count: results.length,
      users: results
    })

  } catch (error: any) {
    console.error('❌ Bulk create users error:', error)
    console.error('❌ Error stack:', error?.stack)
    const errorMessage = error?.message || '알 수 없는 오류'
    
    res.status(500).json({ 
      error: `교직원 일괄 등록 중 오류가 발생했습니다: ${errorMessage}` 
    })
  }
}

// 엑셀 템플릿 다운로드 (샘플 데이터 포함)
export const downloadTemplate = async (req: Request, res: Response) => {
  try {
    // 샘플 데이터 포함 템플릿
    const templateData = [
      ['이름', '이메일', '유형', '권한'],
      ['홍길동', 'hong@example.com', '교원', '일반 사용자'],
      ['김철수', 'kim@example.com', '직원', '연수 관리자'],
      ['이영희', 'lee@example.com', '공무직', '일반 사용자'],
      ['박민수', 'park@example.com', '교원', '최고 관리자'],
      ['정수진', 'jung@example.com', '기간제교사', '일반 사용자'],
      ['최도현', 'choi@example.com', '교육공무직', '연수 관리자'],
    ]

    // 워크북 생성
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)

    // 열 너비 설정
    worksheet['!cols'] = [
      { wch: 15 }, // 이름
      { wch: 30 }, // 이메일
      { wch: 15 }, // 유형
      { wch: 20 }, // 권한
    ]

    // 첫 번째 행 스타일 (헤더)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:D1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E0E0E0' } },
        alignment: { horizontal: 'center' }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, '교직원 목록')

    // 엑셀 파일 생성
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 파일명 설정
    const filename = `교직원_등록_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`

    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    
    res.send(buffer)
  } catch (error: any) {
    console.error('Template download error:', error)
    res.status(500).json({ error: '템플릿 다운로드 중 오류가 발생했습니다.' })
  }
}

