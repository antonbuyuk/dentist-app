import { IsString, IsUUID } from 'class-validator';

export class AssignDoctorDto {
  @IsString()
  @IsUUID()
  doctorId: string;
}

