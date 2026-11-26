// Registra os controllers e serviços de painel do freelancer para uso pelo NestJS.

import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
})
export class DashboardModule {}
