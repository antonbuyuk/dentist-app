import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorResponseDto } from './dto/doctor-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<DoctorResponseDto> {
    try {
      // Генерируем email, если не указан
      let userEmail = createDoctorDto.email;
      if (!userEmail) {
        // Генерируем уникальный email на основе имени и случайного числа
        const baseEmail = `${createDoctorDto.firstName.toLowerCase()}.${createDoctorDto.lastName.toLowerCase()}@doctor.local`;
        let counter = 1;
        userEmail = baseEmail;

        // Проверяем уникальность email
        while (
          await this.prisma.user.findUnique({ where: { email: userEmail } })
        ) {
          userEmail = `${createDoctorDto.firstName.toLowerCase()}.${createDoctorDto.lastName.toLowerCase()}${counter}@doctor.local`;
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

      // Создаем пользователя с ролью doctor
      const user = await this.prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          firstName: createDoctorDto.firstName,
          lastName: createDoctorDto.lastName,
          phone: createDoctorDto.phone,
          role: 'doctor',
        },
      });

      return this.mapToDto(user);
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  async findAll(): Promise<DoctorResponseDto[]> {
    try {
      // Получаем всех пользователей с ролью doctor
      const doctors = await this.prisma.user.findMany({
        where: {
          role: 'doctor',
        },
        orderBy: { createdAt: 'desc' },
      });

      return doctors.map((user) => this.mapToDto(user));
    } catch (error) {
      console.error('Error fetching doctors from database:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<DoctorResponseDto> {
    const doctor = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'doctor',
      },
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
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'doctor',
      },
    });

    if (!existing) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    const doctor = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: updateDoctorDto.firstName,
        lastName: updateDoctorDto.lastName,
        email: updateDoctorDto.email,
        phone: updateDoctorDto.phone,
      },
    });

    return this.mapToDto(doctor);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'doctor',
      },
    });

    if (!existing) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
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
    createdAt: Date;
    updatedAt: Date;
  }): DoctorResponseDto {
    return {
      id: user.id,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      specialization: undefined, // User не имеет specialization
      email: user.email,
      phone: user.phone ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
