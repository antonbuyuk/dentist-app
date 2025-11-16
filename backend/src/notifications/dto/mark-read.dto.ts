import { IsArray, IsUUID } from 'class-validator';

export class MarkReadDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}

