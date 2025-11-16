export class PatientResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
  createdAt!: string;
  updatedAt!: string;
}
