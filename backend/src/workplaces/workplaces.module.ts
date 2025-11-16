import { Module } from '@nestjs/common';
import { WorkplacesController } from './workplaces.controller';
import { WorkplacesService } from './workplaces.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkplacesController],
  providers: [WorkplacesService],
  exports: [WorkplacesService],
})
export class WorkplacesModule {}

