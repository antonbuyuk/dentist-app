export type MedicalRecord = {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  createdById: string
  diagnosis: string | null
  treatment: string | null
  notes: string | null
  recommendations: string | null
  createdAt: string
  updatedAt: string
  patient?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  doctor?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  createdBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  appointment?: {
    id: string
    startTime: string
    endTime: string
    status: string
  }
}

export type CreateMedicalRecordDto = {
  appointmentId: string
  patientId: string
  doctorId: string
  diagnosis?: string
  treatment?: string
  notes?: string
  recommendations?: string
}

export type UpdateMedicalRecordDto = Partial<CreateMedicalRecordDto>

