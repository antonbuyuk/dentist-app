import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateWorkplaceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string; // кабинет, операционная, рентген-кабинет и т.д.

  @IsOptional()
  @IsString()
  location?: string; // адрес или номер кабинета

  @IsOptional()
  @IsString()
  equipment?: string; // описание оборудования

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

