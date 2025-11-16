export type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDoctorDto = {
  firstName: string;
  lastName: string;
  specialization?: string;
  email?: string;
  phone?: string;
};

export type UpdateDoctorDto = Partial<CreateDoctorDto>;

