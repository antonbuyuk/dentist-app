export class UserResponseDto {
  id!: string;
  email!: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  medicalHistory: string | null;
  role!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
