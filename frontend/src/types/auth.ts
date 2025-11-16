export type UserRole = 'developer' | 'rootUser' | 'doctor' | 'patient' | 'admin'

export type LoginDto = {
  email: string
  password: string
}

export type RegisterDto = {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: UserRole
}

export type AuthResponse = {
  access_token: string
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role: UserRole
  }
}

export type User = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
}

