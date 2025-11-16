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

    // Создаем пользователя с ролью patient
    const user = await this.prisma.user.create({
      data: {
        email: userEmail,
        password: hashedPassword,
        firstName: createPatientDto.firstName,
        lastName: createPatientDto.lastName,
        phone: createPatientDto.phone,
        dateOfBirth: createPatientDto.dateOfBirth
          ? new Date(createPatientDto.dateOfBirth)
          : null,
        address: createPatientDto.address,
        role: 'patient',
      },
    });

    return this.mapToDto(user);
  }

  async findAll(): Promise<PatientResponseDto[]> {
    try {
      // Получаем всех пользователей с ролью patient
      const patients = await this.prisma.user.findMany({
        where: {
          role: 'patient',
        },
        orderBy: { createdAt: 'desc' },
      });
      return patients.map((user) => this.mapToDto(user));
    } catch (error) {
      console.error('Error fetching patients from database:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'patient',
      },
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
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'patient',
      },
    });

    if (!existing) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const patient = await this.prisma.user.update({
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
      },
    });

    return this.mapToDto(patient);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'patient',
      },
    });

    if (!existing) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  private mapToDto(user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    dateOfBirth: Date | null;
    address: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PatientResponseDto {
    return {
      id: user.id,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email,
      phone: user.phone ?? undefined,
      dateOfBirth: user.dateOfBirth?.toISOString(),
      address: user.address ?? undefined,
      notes: undefined, // User не имеет notes, но можно использовать medicalHistory если нужно
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
