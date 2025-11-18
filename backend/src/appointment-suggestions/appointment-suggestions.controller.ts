import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentSuggestionsService } from './appointment-suggestions.service';
import { CreateAppointmentSuggestionDto } from './dto/create-appointment-suggestion.dto';
import { UpdateAppointmentSuggestionDto } from './dto/update-appointment-suggestion.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

@Controller('appointment-suggestions')
@UseGuards(JwtAuthGuard)
export class AppointmentSuggestionsController {
  constructor(private readonly suggestionsService: AppointmentSuggestionsService) {}

  @Post()
  async create(
    @Body() createDto: CreateAppointmentSuggestionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.suggestionsService.create(createDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.suggestionsService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.suggestionsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentSuggestionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.suggestionsService.update(id, updateDto, req.user.id, req.user.role);
  }
}

