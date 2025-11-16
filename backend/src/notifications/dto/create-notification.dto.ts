import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsIn([
    'appointment_reminder',
    'appointment_created',
    'appointment_cancelled',
    'appointment_updated',
    'system',
  ])
  type!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsUUID()
  @IsOptional()
  appointmentId?: string;
}

