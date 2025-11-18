import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateAppointmentSuggestionDto {
  @IsUUID()
  patientId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  workplaceId?: string;
}
