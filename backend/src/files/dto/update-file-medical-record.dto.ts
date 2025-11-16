import { IsUUID, IsOptional } from 'class-validator';

export class UpdateFileMedicalRecordDto {
  @IsUUID()
  @IsOptional()
  medicalRecordId?: string;
}

