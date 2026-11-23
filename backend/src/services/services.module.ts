import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { InterestsController } from './interests.controller';
import { FreelancersController } from './freelancers.controller';

@Module({
  controllers: [ServicesController, InterestsController, FreelancersController],
  providers: [ServicesService, PrismaService],
})
export class ServicesModule {}
