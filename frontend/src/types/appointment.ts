export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    email?: string;
    phone?: string;
  };
};

export type CreateAppointmentDto = {
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status?: string;
};

export type UpdateAppointmentDto = Partial<CreateAppointmentDto>;

