import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorResponseDto } from './dto/doctor-response.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  async create(@Body() createDoctorDto: CreateDoctorDto): Promise<DoctorResponseDto> {
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  async findAll(): Promise<DoctorResponseDto[]> {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DoctorResponseDto> {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<DoctorResponseDto> {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.doctorsService.remove(id);
  }
}

