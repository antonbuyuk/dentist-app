import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const startTime = new Date(createAppointmentDto.startTime);
    const endTime = new Date(createAppointmentDto.endTime);

    // Валидация времени
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Время окончания должно быть позже времени начала',
      );
    }

    // Проверка существования пациента и врача
    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: createAppointmentDto.patientId },
      }),
      this.prisma.doctor.findUnique({
        where: { id: createAppointmentDto.doctorId },
      }),
    ]);

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createAppointmentDto.patientId} not found`,
      );
    }

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${createAppointmentDto.doctorId} not found`,
      );
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
    const conflictingPatientAppointment =
      await this.prisma.appointment.findFirst({
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

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<AppointmentResponseDto[]> {
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

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
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
        throw new BadRequestException(
          'Время окончания должно быть позже времени начала',
        );
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.startTime = startTime;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.endTime = endTime;
    }

    if (updateAppointmentDto.patientId) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: updateAppointmentDto.patientId },
      });
      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${updateAppointmentDto.patientId} not found`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.patientId = updateAppointmentDto.patientId;
    }

    if (updateAppointmentDto.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: updateAppointmentDto.doctorId },
      });
      if (!doctor) {
        throw new NotFoundException(
          `Doctor with ID ${updateAppointmentDto.doctorId} not found`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.doctorId = updateAppointmentDto.doctorId;
    }

    if (updateAppointmentDto.notes !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.notes = updateAppointmentDto.notes;
    }

    if (updateAppointmentDto.status) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.status = updateAppointmentDto.status;
    }

    const appointment = await (this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
      },
    }) as Promise<any>);

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: appointment.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      patientId: appointment.patientId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      doctorId: appointment.doctorId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      startTime: appointment.startTime.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      endTime: appointment.endTime.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      notes: appointment.notes ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      status: appointment.status,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      createdAt: appointment.createdAt.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      updatedAt: appointment.updatedAt.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      patient: appointment.patient
        ? {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            id: appointment.patient.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            firstName: appointment.patient.firstName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            lastName: appointment.patient.lastName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            email: appointment.patient.email ?? undefined,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            phone: appointment.patient.phone ?? undefined,
          }
        : undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      doctor: appointment.doctor
        ? {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            id: appointment.doctor.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            firstName: appointment.doctor.firstName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            lastName: appointment.doctor.lastName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            specialization: appointment.doctor.specialization ?? undefined,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            email: appointment.doctor.email ?? undefined,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            phone: appointment.doctor.phone ?? undefined,
          }
        : undefined,
    };
  }
}
