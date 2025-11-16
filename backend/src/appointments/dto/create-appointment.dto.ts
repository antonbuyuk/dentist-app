import { IsString, IsDateString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  doctorId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  recurrenceRule?: string; // daily, weekly, monthly

  @IsDateString()
  @IsOptional()
  recurrenceEndDate?: string; // Дата окончания повторения
}
