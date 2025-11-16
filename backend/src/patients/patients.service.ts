import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.create({
      data: {
        firstName: createPatientDto.firstName,
        lastName: createPatientDto.lastName,
        email: createPatientDto.email,
        phone: createPatientDto.phone,
        dateOfBirth: createPatientDto.dateOfBirth
          ? new Date(createPatientDto.dateOfBirth)
          : null,
        address: createPatientDto.address,
        notes: createPatientDto.notes,
      },
    });

    return this.mapToDto(patient);
  }

  async findAll(): Promise<PatientResponseDto[]> {
    try {
      const patients = await this.prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return patients.map((p: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        dateOfBirth: Date | null;
        address: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
      }) => this.mapToDto(p));
    } catch (error) {
      console.error('Error fetching patients from database:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return this.mapToDto(patient);
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    const existing = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        firstName: updatePatientDto.firstName,
        lastName: updatePatientDto.lastName,
        email: updatePatientDto.email,
        phone: updatePatientDto.phone,
        dateOfBirth: updatePatientDto.dateOfBirth
          ? new Date(updatePatientDto.dateOfBirth)
          : undefined,
        address: updatePatientDto.address,
        notes: updatePatientDto.notes,
      },
    });

    return this.mapToDto(patient);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    await this.prisma.patient.delete({
      where: { id },
    });
  }

  private mapToDto(patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: Date | null;
    address: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PatientResponseDto {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email ?? undefined,
      phone: patient.phone ?? undefined,
      dateOfBirth: patient.dateOfBirth?.toISOString(),
      address: patient.address ?? undefined,
      notes: patient.notes ?? undefined,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
    };
  }
}

