export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePatientDto = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
};

export type UpdatePatientDto = Partial<CreatePatientDto>;

