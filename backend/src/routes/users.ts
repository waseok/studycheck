import { Router } from 'express'
import multer from 'multer'
import { getUsers, createUser, updateUser, deleteUser, resetUserPin, bulkCreateUsers, downloadTemplate, getMyProfile, updateMyProfile } from '../controllers/users'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

// multer 설정 (메모리에 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 엑셀 파일만 허용
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream', // 일부 브라우저에서 .xlsx를 이렇게 보냄
    ]
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls')) {
      cb(null, true)
    } else {
      cb(new Error('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'))
    }
  }
})

router.get('/', authMiddleware, adminMiddleware, getUsers)
router.get('/me', authMiddleware, getMyProfile) // 현재 사용자 정보 조회
router.put('/me', authMiddleware, updateMyProfile) // 현재 사용자 정보 수정
router.get('/template', authMiddleware, adminMiddleware, downloadTemplate)
router.post('/', authMiddleware, adminMiddleware, createUser)
router.post('/bulk', authMiddleware, adminMiddleware, upload.single('file'), bulkCreateUsers)
router.put('/:id', authMiddleware, adminMiddleware, updateUser)
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser)
router.post('/:id/reset-pin', authMiddleware, adminMiddleware, resetUserPin)

export default router

