import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { WorkplacesService } from './workplaces.service';
import { CreateWorkplaceDto } from './dto/create-workplace.dto';
import { UpdateWorkplaceDto } from './dto/update-workplace.dto';
import { WorkplaceResponseDto } from './dto/workplace-response.dto';
import { AssignDoctorDto } from './dto/assign-doctor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

@Controller('workplaces')
@UseGuards(JwtAuthGuard)
export class WorkplacesController {
  constructor(private readonly workplacesService: WorkplacesService) {}

  @Post()
  async create(
    @Body() createWorkplaceDto: CreateWorkplaceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<WorkplaceResponseDto> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для создания рабочих мест',
      );
    }

    return this.workplacesService.create(createWorkplaceDto);
  }

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
  ): Promise<WorkplaceResponseDto[]> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'doctor', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для просмотра рабочих мест',
      );
    }

    return this.workplacesService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<WorkplaceResponseDto> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'doctor', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для просмотра рабочего места',
      );
    }

    return this.workplacesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWorkplaceDto: UpdateWorkplaceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<WorkplaceResponseDto> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для редактирования рабочих мест',
      );
    }

    return this.workplacesService.update(id, updateWorkplaceDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для удаления рабочих мест',
      );
    }

    await this.workplacesService.delete(id);
    return { message: 'Рабочее место успешно удалено' };
  }

  @Post(':id/doctors')
  async assignDoctor(
    @Param('id') id: string,
    @Body() assignDoctorDto: AssignDoctorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для назначения врачей на рабочие места',
      );
    }

    await this.workplacesService.assignDoctor(id, assignDoctorDto);
    return { message: 'Врач успешно назначен на рабочее место' };
  }

  @Delete(':id/doctors/:doctorId')
  async unassignDoctor(
    @Param('id') id: string,
    @Param('doctorId') doctorId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для снятия врачей с рабочих мест',
      );
    }

    await this.workplacesService.unassignDoctor(id, doctorId);
    return { message: 'Врач успешно снят с рабочего места' };
  }

  @Get(':id/doctors')
  async getWorkplaceDoctors(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'doctor', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для просмотра врачей рабочего места',
      );
    }

    return this.workplacesService.getWorkplaceDoctors(id);
  }
}

