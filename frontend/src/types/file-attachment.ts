export type FileAttachment = {
  id: string
  medicalRecordId: string | null
  userId: string
  fileName: string
  filePath: string | null
  fileData?: string | null // Base64 данные в формате data:image
  fileSize: number
  mimeType: string
  description: string | null
  createdAt: string
  uploadedBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
}

export type UploadFileResponse = FileAttachment

