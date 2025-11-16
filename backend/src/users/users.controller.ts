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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserResponseDto } from './dto/user-response.dto';
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

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, req.user.role);
  }

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponseDto[]> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для просмотра списка пользователей',
      );
    }

    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    // Проверяем права доступа
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для просмотра пользователя',
      );
    }

    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, req.user.role);
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(id, updateRoleDto, req.user.role);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.usersService.deleteUser(id, req.user.role);
    return { message: 'Пользователь успешно удален' };
  }
}
