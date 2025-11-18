export class WorkplaceResponseDto {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  location: string | null;
  equipment: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  doctors?: Array<{
    doctorId: string;
    doctor?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  }>;
}
