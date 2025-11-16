import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPatientDto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    // Генерируем email, если не указан
    let userEmail = createPatientDto.email;
    if (!userEmail) {
      // Генерируем уникальный email на основе имени и случайного числа
      const baseEmail = `${createPatientDto.firstName.toLowerCase()}.${createPatientDto.lastName.toLowerCase()}@patient.local`;
      let counter = 1;
      userEmail = baseEmail;

      // Проверяем уникальность email
      while (
        await this.prisma.user.findUnique({ where: { email: userEmail } })
      ) {
        userEmail = `${createPatientDto.firstName.toLowerCase()}.${createPatientDto.lastName.toLowerCase()}${counter}@patient.local`;
        counter++;
      }
    } else {
      // Проверяем, не существует ли уже пользователь с таким email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userEmail },
      });
      if (existingUser) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    // Генерируем временный пароль
    const tempPassword = `temp${Math.random().toString(36).slice(-8)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Создаем пользователя и пациента в транзакции
    const result = await this.prisma.$transaction(async (tx) => {
      // Создаем пользователя
      const user = await tx.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          firstName: createPatientDto.firstName,
          lastName: createPatientDto.lastName,
          role: 'patient',
        },
      });

      // Создаем пациента и связываем с пользователем
      const patient = await tx.patient.create({
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
          userId: user.id,
        },
      });

      return patient;
    });

    return this.mapToDto(result);
  }

  async findAll(): Promise<PatientResponseDto[]> {
    try {
      const patients = await this.prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return patients.map(
        (p: {
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
        }) => this.mapToDto(p),
      );
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
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Если есть связанный пользователь, обновляем его данные
    if (existing.userId) {
      await this.prisma.user.update({
        where: { id: existing.userId },
        data: {
          firstName: updatePatientDto.firstName,
          lastName: updatePatientDto.lastName,
          email: updatePatientDto.email || existing.user?.email,
        },
      });
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
