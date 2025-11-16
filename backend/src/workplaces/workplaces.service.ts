import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkplaceDto } from './dto/create-workplace.dto';
import { UpdateWorkplaceDto } from './dto/update-workplace.dto';
import { WorkplaceResponseDto } from './dto/workplace-response.dto';
import { AssignDoctorDto } from './dto/assign-doctor.dto';

@Injectable()
export class WorkplacesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createWorkplaceDto: CreateWorkplaceDto,
  ): Promise<WorkplaceResponseDto> {
    // Проверяем, не существует ли уже рабочее место с таким именем
    const existing = await this.prisma.workplace.findFirst({
      where: { name: createWorkplaceDto.name },
    });

    if (existing) {
      throw new ConflictException(
        'Рабочее место с таким именем уже существует',
      );
    }

    const workplace = await this.prisma.workplace.create({
      data: {
        name: createWorkplaceDto.name,
        description: createWorkplaceDto.description,
        type: createWorkplaceDto.type,
        location: createWorkplaceDto.location,
        equipment: createWorkplaceDto.equipment,
        isActive: createWorkplaceDto.isActive ?? true,
      },
    });

    return this.mapToDto(workplace);
  }

  async findAll(): Promise<WorkplaceResponseDto[]> {
    const workplaces = await this.prisma.workplace.findMany({
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return workplaces.map((w) => this.mapToDto(w));
  }

  async findOne(id: string): Promise<WorkplaceResponseDto> {
    const workplace = await this.prisma.workplace.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
      },
    });

    if (!workplace) {
      throw new NotFoundException(`Workplace with ID ${id} not found`);
    }

    return this.mapToDto(workplace);
  }

  async update(
    id: string,
    updateWorkplaceDto: UpdateWorkplaceDto,
  ): Promise<WorkplaceResponseDto> {
    const existing = await this.prisma.workplace.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Workplace with ID ${id} not found`);
    }

    // Если имя изменяется, проверяем уникальность
    if (updateWorkplaceDto.name && updateWorkplaceDto.name !== existing.name) {
      const duplicate = await this.prisma.workplace.findFirst({
        where: { name: updateWorkplaceDto.name },
      });

      if (duplicate) {
        throw new ConflictException(
          'Рабочее место с таким именем уже существует',
        );
      }
    }

    const workplace = await this.prisma.workplace.update({
      where: { id },
      data: {
        name: updateWorkplaceDto.name,
        description: updateWorkplaceDto.description,
        type: updateWorkplaceDto.type,
        location: updateWorkplaceDto.location,
        equipment: updateWorkplaceDto.equipment,
        isActive: updateWorkplaceDto.isActive,
      },
    });

    return this.mapToDto(workplace);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.workplace.findUnique({
      where: { id },
      include: {
        appointments: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Workplace with ID ${id} not found`);
    }

    // Проверяем, есть ли связанные приёмы
    if (existing.appointments.length > 0) {
      throw new BadRequestException(
        'Невозможно удалить рабочее место, так как с ним связаны приёмы',
      );
    }

    await this.prisma.workplace.delete({
      where: { id },
    });
  }

  async assignDoctor(
    workplaceId: string,
    assignDoctorDto: AssignDoctorDto,
  ): Promise<void> {
    // Проверяем существование рабочего места
    const workplace = await this.prisma.workplace.findUnique({
      where: { id: workplaceId },
    });

    if (!workplace) {
      throw new NotFoundException(`Workplace with ID ${workplaceId} not found`);
    }

    // Проверяем существование пользователя с ролью doctor
    const doctor = await this.prisma.user.findFirst({
      where: {
        id: assignDoctorDto.doctorId,
        role: 'doctor',
      },
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${assignDoctorDto.doctorId} not found`,
      );
    }

    // Проверяем, не назначен ли уже врач на это рабочее место
    const existing = await this.prisma.doctorWorkplace.findUnique({
      where: {
        doctorId_workplaceId: {
          doctorId: assignDoctorDto.doctorId,
          workplaceId: workplaceId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Врач уже назначен на это рабочее место');
    }

    await this.prisma.doctorWorkplace.create({
      data: {
        doctorId: assignDoctorDto.doctorId,
        workplaceId: workplaceId,
      },
    });
  }

  async unassignDoctor(workplaceId: string, doctorId: string): Promise<void> {
    const existing = await this.prisma.doctorWorkplace.findUnique({
      where: {
        doctorId_workplaceId: {
          doctorId: doctorId,
          workplaceId: workplaceId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Врач не назначен на это рабочее место');
    }

    await this.prisma.doctorWorkplace.delete({
      where: {
        doctorId_workplaceId: {
          doctorId: doctorId,
          workplaceId: workplaceId,
        },
      },
    });
  }

  async getWorkplaceDoctors(workplaceId: string) {
    const workplace = await this.prisma.workplace.findUnique({
      where: { id: workplaceId },
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
      },
    });

    if (!workplace) {
      throw new NotFoundException(`Workplace with ID ${workplaceId} not found`);
    }

    return workplace.doctors.map((dw) => ({
      id: dw.doctor.id,
      firstName: dw.doctor.firstName ?? '',
      lastName: dw.doctor.lastName ?? '',
      specialization: undefined, // User не имеет specialization
      email: dw.doctor.email ?? undefined,
      phone: dw.doctor.phone ?? undefined,
      assignedAt: dw.createdAt,
    }));
  }

  private mapToDto(workplace: any): WorkplaceResponseDto {
    return {
      id: workplace.id,
      name: workplace.name,
      description: workplace.description,
      type: workplace.type,
      location: workplace.location,
      equipment: workplace.equipment,
      isActive: workplace.isActive,
      createdAt: workplace.createdAt,
      updatedAt: workplace.updatedAt,
    };
  }
}
