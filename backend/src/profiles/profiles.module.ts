// Registra os controllers e serviços de perfis para uso pelo NestJS.

import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, PrismaService],
})
export class ProfilesModule {}
