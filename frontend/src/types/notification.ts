export type Notification = {
  id: string
  userId: string
  type: 'appointment_reminder' | 'appointment_created' | 'appointment_cancelled' | 'appointment_updated' | 'system'
  title: string
  message: string
  read: boolean
  appointmentId?: string
  createdAt: string
}

export type CreateNotificationDto = {
  userId: string
  type: 'appointment_reminder' | 'appointment_created' | 'appointment_cancelled' | 'appointment_updated' | 'system'
  title: string
  message: string
  appointmentId?: string
}

export type MarkReadDto = {
  ids: string[]
}

