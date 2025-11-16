export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: string;
  recurrenceRule?: string; // daily, weekly, monthly
  recurrenceEndDate?: string;
  parentAppointmentId?: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    userId?: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    email?: string;
    phone?: string;
    userId?: string;
    color?: string;
  };
};

export type CreateAppointmentDto = {
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status?: string;
  recurrenceRule?: 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string;
};

export type UpdateAppointmentDto = Partial<CreateAppointmentDto>;

