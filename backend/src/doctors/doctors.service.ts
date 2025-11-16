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

      // Создаем пользователя и врача в транзакции
      const result = await this.prisma.$transaction(async (tx) => {
        // Создаем пользователя
        const user = await tx.user.create({
          data: {
            email: userEmail,
            password: hashedPassword,
            firstName: createDoctorDto.firstName,
            lastName: createDoctorDto.lastName,
            role: 'doctor',
          },
        });

        // Создаем врача и связываем с пользователем
        const doctor = await tx.doctor.create({
          data: {
            firstName: createDoctorDto.firstName,
            lastName: createDoctorDto.lastName,
            specialization: createDoctorDto.specialization,
            email: createDoctorDto.email,
            phone: createDoctorDto.phone,
            userId: user.id,
          },
        });

        return doctor;
      });

      return this.mapToDto(result);
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  async findAll(): Promise<DoctorResponseDto[]> {
    try {
      // Получаем всех врачей с включенными данными пользователя

      const doctors = await (this.prisma.doctor.findMany({
        include: {
          user: true,
        } as any,
        orderBy: { createdAt: 'desc' },
      }) as Promise<any[]>);

      // Также получаем всех пользователей с ролью doctor, у которых нет записи в таблице doctors

      const allUsersWithDoctorRole = await (this.prisma.user.findMany({
        where: {
          role: 'doctor',
        },
        include: {
          doctor: true,
        } as any,
      }) as Promise<any[]>);

      // Фильтруем только тех, у кого нет связанной записи в таблице doctors

      const usersWithDoctorRole = allUsersWithDoctorRole.filter(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (user: any) => !user.doctor,
      );

      // Преобразуем пользователей без записи в таблице doctors в формат DoctorResponseDto
      const doctorsFromUsers = usersWithDoctorRole.map((user: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: user.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        firstName: user.firstName || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        lastName: user.lastName || '',
        specialization: null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        email: user.email,
        phone: null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        createdAt: user.createdAt,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        updatedAt: user.updatedAt,
      }));

      // Объединяем врачей из таблицы doctors и пользователей с ролью doctor
      const allDoctors = [
        ...doctors.map((d: any) => {
          // Используем данные из таблицы doctors, но email берем из связанного пользователя если есть
          const doctorData = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            id: d.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            firstName: d.firstName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            lastName: d.lastName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            specialization: d.specialization,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            email: d.user?.email || d.email,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            phone: d.phone,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            createdAt: d.createdAt,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            updatedAt: d.updatedAt,
          };
          return this.mapToDto(doctorData);
        }),
        ...doctorsFromUsers.map((d) => this.mapToDto(d)),
      ];

      // Удаляем дубликаты по email (если пользователь уже есть в таблице doctors)
      const uniqueDoctors = allDoctors.filter(
        (doctor, index, self) =>
          index === self.findIndex((d) => d.email === doctor.email),
      );

      return uniqueDoctors;
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing = await (this.prisma.doctor.findUnique({
      where: { id },
      include: { user: true } as any,
    }) as Promise<any>);

    if (!existing) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    // Если есть связанный пользователь, обновляем его данные
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existingWithUser = existing;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (existingWithUser.userId) {
      await this.prisma.user.update({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        where: { id: existingWithUser.userId },
        data: {
          firstName: updateDoctorDto.firstName,
          lastName: updateDoctorDto.lastName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          email: updateDoctorDto.email || existingWithUser.user?.email,
        },
      });
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
