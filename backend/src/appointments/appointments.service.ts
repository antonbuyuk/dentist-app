import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const startTime = new Date(createAppointmentDto.startTime);
    const endTime = new Date(createAppointmentDto.endTime);

    // Валидация времени
    if (startTime >= endTime) {
      throw new BadRequestException('Время окончания должно быть позже времени начала');
    }

    // Проверка существования пациента и врача
    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: createAppointmentDto.patientId } }),
      this.prisma.doctor.findUnique({ where: { id: createAppointmentDto.doctorId } }),
    ]);

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${createAppointmentDto.patientId} not found`);
    }

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${createAppointmentDto.doctorId} not found`);
    }

    // Проверка пересечений времени для врача
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: createAppointmentDto.doctorId,
        status: { not: 'cancelled' },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException('Врач уже занят в это время');
    }

    // Проверка пересечений времени для пациента
    const conflictingPatientAppointment = await this.prisma.appointment.findFirst({
      where: {
        patientId: createAppointmentDto.patientId,
        status: { not: 'cancelled' },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingPatientAppointment) {
      throw new ConflictException('У пациента уже есть приём в это время');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: createAppointmentDto.patientId,
        doctorId: createAppointmentDto.doctorId,
        startTime,
        endTime,
        notes: createAppointmentDto.notes,
        status: createAppointmentDto.status || 'scheduled',
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return this.mapToDto(appointment);
  }

  async findAll(): Promise<AppointmentResponseDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((a) => this.mapToDto(a));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AppointmentResponseDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((a) => this.mapToDto(a));
  }

  async findOne(id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return this.mapToDto(appointment);
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<AppointmentResponseDto> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    const updateData: any = {};

    if (updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
      const startTime = updateAppointmentDto.startTime
        ? new Date(updateAppointmentDto.startTime)
        : existing.startTime;
      const endTime = updateAppointmentDto.endTime
        ? new Date(updateAppointmentDto.endTime)
        : existing.endTime;

      if (startTime >= endTime) {
        throw new BadRequestException('Время окончания должно быть позже времени начала');
      }

      // Проверка пересечений (исключая текущий приём)
      const doctorId = updateAppointmentDto.doctorId || existing.doctorId;
      const conflictingAppointment = await this.prisma.appointment.findFirst({
        where: {
          id: { not: id },
          doctorId,
          status: { not: 'cancelled' },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
      });

      if (conflictingAppointment) {
        throw new ConflictException('Врач уже занят в это время');
      }

      updateData.startTime = startTime;
      updateData.endTime = endTime;
    }

    if (updateAppointmentDto.patientId) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: updateAppointmentDto.patientId },
      });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${updateAppointmentDto.patientId} not found`);
      }
      updateData.patientId = updateAppointmentDto.patientId;
    }

    if (updateAppointmentDto.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: updateAppointmentDto.doctorId },
      });
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${updateAppointmentDto.doctorId} not found`);
      }
      updateData.doctorId = updateAppointmentDto.doctorId;
    }

    if (updateAppointmentDto.notes !== undefined) {
      updateData.notes = updateAppointmentDto.notes;
    }

    if (updateAppointmentDto.status) {
      updateData.status = updateAppointmentDto.status;
    }

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
      },
    });

    return this.mapToDto(appointment);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  private mapToDto(appointment: any): AppointmentResponseDto {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      notes: appointment.notes ?? undefined,
      status: appointment.status,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      patient: appointment.patient
        ? {
            id: appointment.patient.id,
            firstName: appointment.patient.firstName,
            lastName: appointment.patient.lastName,
            email: appointment.patient.email ?? undefined,
            phone: appointment.patient.phone ?? undefined,
          }
        : undefined,
      doctor: appointment.doctor
        ? {
            id: appointment.doctor.id,
            firstName: appointment.doctor.firstName,
            lastName: appointment.doctor.lastName,
            specialization: appointment.doctor.specialization ?? undefined,
            email: appointment.doctor.email ?? undefined,
            phone: appointment.doctor.phone ?? undefined,
          }
        : undefined,
    };
  }
}

