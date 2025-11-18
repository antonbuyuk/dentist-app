export class AppointmentSuggestionResponseDto {
  id!: string;
  doctorId!: string;
  patientId!: string;
  startTime!: string;
  endTime!: string;
  notes?: string | null;
  status!: string;
  workplaceId?: string | null;
  createdAt!: string;
  updatedAt!: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  doctor?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  patient?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  reviewer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  workplace?: {
    id: string;
    name: string;
  } | null;
}
