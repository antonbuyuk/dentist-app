import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    createUserDto: CreateUserDto,
    currentUserRole: string,
  ): Promise<UserResponseDto> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(currentUserRole)) {
      throw new ForbiddenException(
        'Недостаточно прав для создания пользователей',
      );
    }

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Создаем пользователя
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        dateOfBirth: createUserDto.dateOfBirth
          ? new Date(createUserDto.dateOfBirth)
          : null,
        address: createUserDto.address,
        medicalHistory: createUserDto.medicalHistory,
        color: createUserDto.color,
        role: createUserDto.role || 'patient',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        medicalHistory: true,
        color: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        medicalHistory: true,
        color: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        medicalHistory: true,
        color: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    currentUserRole: string,
  ): Promise<UserResponseDto> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(currentUserRole)) {
      throw new ForbiddenException(
        'Недостаточно прав для редактирования пользователей',
      );
    }

    // Проверяем, существует ли пользователь
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Если email изменяется, проверяем уникальность
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};

    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email;
    }
    if (updateUserDto.firstName !== undefined) {
      updateData.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      updateData.lastName = updateUserDto.lastName;
    }
    if (updateUserDto.phone !== undefined) {
      updateData.phone = updateUserDto.phone;
    }
    if (updateUserDto.dateOfBirth !== undefined) {
      updateData.dateOfBirth = updateUserDto.dateOfBirth
        ? new Date(updateUserDto.dateOfBirth)
        : null;
    }
    if (updateUserDto.address !== undefined) {
      updateData.address = updateUserDto.address;
    }
    if (updateUserDto.medicalHistory !== undefined) {
      updateData.medicalHistory = updateUserDto.medicalHistory;
    }
    if (updateUserDto.color !== undefined) {
      updateData.color = updateUserDto.color;
    }
    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }

    // Если пароль указан, хешируем его
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Обновляем пользователя
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        medicalHistory: true,
        color: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updateRole(
    userId: string,
    updateRoleDto: UpdateUserRoleDto,
    currentUserRole: string,
  ): Promise<UserResponseDto> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(currentUserRole)) {
      throw new ForbiddenException('Недостаточно прав для изменения ролей');
    }

    // Проверяем, существует ли пользователь
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Обновляем роль
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: updateRoleDto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        medicalHistory: true,
        color: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(userId: string, currentUserRole: string): Promise<void> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(currentUserRole)) {
      throw new ForbiddenException(
        'Недостаточно прав для удаления пользователей',
      );
    }

    // Проверяем, существует ли пользователь
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
