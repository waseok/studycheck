import jwt from 'jsonwebtoken'

const DEFAULT_DEV_SECRET = 'unified-dev-secret-2025'
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET

type SignatureResourceType = 'training' | 'meeting'

export interface SignatureAccessPayload {
  type: SignatureResourceType
  resourceId: string
  userId: string
}

interface DecodedPayload extends SignatureAccessPayload {
  iat: number
  exp: number
}

export const createSignatureAccessToken = (payload: SignatureAccessPayload, expiresInHours = 72): string => {
  const normalizedHours = Math.min(168, Math.max(1, Math.floor(expiresInHours)))
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${normalizedHours}h`
  })
}

export const verifySignatureAccessToken = (
  token: string,
  expectedType: SignatureResourceType,
  expectedResourceId: string
): DecodedPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedPayload
    if (
      decoded.type !== expectedType ||
      decoded.resourceId !== expectedResourceId ||
      !decoded.userId
    ) {
      return null
    }
    return decoded
  } catch {
    return null
  }
}
