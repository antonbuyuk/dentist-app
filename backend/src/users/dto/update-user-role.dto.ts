import { IsString, IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['developer', 'rootUser', 'doctor', 'patient', 'admin'])
  role: string;
}
