import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorResponseDto } from './dto/doctor-response.dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<DoctorResponseDto> {
    try {
      const doctor = await this.prisma.doctor.create({
        data: {
          firstName: createDoctorDto.firstName,
          lastName: createDoctorDto.lastName,
          specialization: createDoctorDto.specialization,
          email: createDoctorDto.email,
          phone: createDoctorDto.phone,
        },
      });

      return this.mapToDto(doctor);
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  async findAll(): Promise<DoctorResponseDto[]> {
    try {
      const doctors = await this.prisma.doctor.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return doctors.map((d: {
        id: string;
        firstName: string;
        lastName: string;
        specialization: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
      }) => this.mapToDto(d));
    } catch (error) {
      console.error('Error fetching doctors from database:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<DoctorResponseDto> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return this.mapToDto(doctor);
  }

  async update(
    id: string,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<DoctorResponseDto> {
    const existing = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    const doctor = await this.prisma.doctor.update({
      where: { id },
      data: {
        firstName: updateDoctorDto.firstName,
        lastName: updateDoctorDto.lastName,
        specialization: updateDoctorDto.specialization,
        email: updateDoctorDto.email,
        phone: updateDoctorDto.phone,
      },
    });

    return this.mapToDto(doctor);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    await this.prisma.doctor.delete({
      where: { id },
    });
  }

  private mapToDto(doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
    email: string | null;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DoctorResponseDto {
    return {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization ?? undefined,
      email: doctor.email ?? undefined,
      phone: doctor.phone ?? undefined,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
    };
  }
}

