import { IsString, IsIn } from 'class-validator';

export class UpdateAppointmentSuggestionDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status!: string;
}
