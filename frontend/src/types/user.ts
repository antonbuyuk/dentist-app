export interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  address?: string | null
  medicalHistory?: string | null
  role: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  medicalHistory?: string
  role?: 'developer' | 'rootUser' | 'doctor' | 'patient' | 'admin'
}

export interface UpdateUserDto {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  medicalHistory?: string
  role?: 'developer' | 'rootUser' | 'doctor' | 'patient' | 'admin'
}

export interface UpdateUserRoleDto {
  role: 'developer' | 'rootUser' | 'doctor' | 'patient' | 'admin'
}
