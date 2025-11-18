export interface Workplace {
  id: string
  name: string
  description?: string | null
  type?: string | null
  location?: string | null
  equipment?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  doctors?: Array<{
    doctorId: string
    doctor?: {
      id: string
      firstName: string | null
      lastName: string | null
      email: string
    }
  }>
}

export interface CreateWorkplaceDto {
  name: string
  description?: string
  type?: string
  location?: string
  equipment?: string
  isActive?: boolean
}

export interface UpdateWorkplaceDto {
  name?: string
  description?: string
  type?: string
  location?: string
  equipment?: string
  isActive?: boolean
}

export interface AssignDoctorDto {
  doctorId: string
}

