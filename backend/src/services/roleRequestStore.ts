import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface RoleRequest {
  id: string
  userId: string
  message: string
  status: RoleRequestStatus
  rejectReason?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
}

const DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'role-requests.json')

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf-8')
  }
}

async function readAll(): Promise<RoleRequest[]> {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE, 'utf-8')
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

async function writeAll(requests: RoleRequest[]): Promise<void> {
  await ensureDataFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(requests, null, 2), 'utf-8')
}

export async function getAllRoleRequests(): Promise<RoleRequest[]> {
  return readAll()
}

export async function getRoleRequestsByUserId(userId: string): Promise<RoleRequest[]> {
  const all = await readAll()
  return all
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getPendingRoleRequests(): Promise<RoleRequest[]> {
  const all = await readAll()
  return all
    .filter((r) => r.status === 'PENDING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export async function getPendingRequestByUserId(userId: string): Promise<RoleRequest | null> {
  const all = await readAll()
  return all.find((r) => r.userId === userId && r.status === 'PENDING') || null
}

export async function createRoleRequest(userId: string, message: string): Promise<RoleRequest> {
  const all = await readAll()
  const pending = all.find((r) => r.userId === userId && r.status === 'PENDING')
  if (pending) {
    throw new Error('PENDING_EXISTS')
  }

  const request: RoleRequest = {
    id: randomUUID(),
    userId,
    message: message.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }

  all.push(request)
  await writeAll(all)
  return request
}

export async function updateRoleRequest(
  id: string,
  update: Partial<Pick<RoleRequest, 'status' | 'rejectReason' | 'reviewedBy' | 'reviewedAt'>>
): Promise<RoleRequest | null> {
  const all = await readAll()
  const index = all.findIndex((r) => r.id === id)
  if (index === -1) return null

  all[index] = { ...all[index], ...update }
  await writeAll(all)
  return all[index]
}
