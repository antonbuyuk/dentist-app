export class NotificationResponseDto {
  id!: string;
  userId!: string;
  type!: string; // appointment_reminder, appointment_created, appointment_cancelled, appointment_updated, system
  title!: string;
  message!: string;
  read!: boolean;
  appointmentId?: string;
  createdAt!: string;
}

