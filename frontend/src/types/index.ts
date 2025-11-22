export interface User {
  id: string
  name: string
  email: string
  userType: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface Training {
  id: string
  name: string
  registrationBook?: string
  cycle?: string
  targetUsers: string[]
  hours?: string
  implementationDate?: string
  department?: string
  manager?: string
  method?: string
  methodLink?: string
  deadline?: string
  createdAt: string
  updatedAt: string
  participants?: TrainingParticipant[]
}

export interface TrainingParticipant {
  id: string
  trainingId: string
  userId: string
  completionNumber?: string
  status: 'pending' | 'completed'
  completedAt?: string
  createdAt: string
  updatedAt: string
  user?: User
  training?: Training
}

export type AppRole = 'SUPER_ADMIN' | 'TRAINING_ADMIN' | 'USER'

export interface AuthResponse {
  success: boolean
  token: string
  isAdmin: boolean
  role?: AppRole
  message: string
}

