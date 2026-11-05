import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalService } from './client-portal.service';

@Module({
  controllers: [ClientPortalController],
  providers: [ClientPortalService, PrismaService],
})
export class ClientPortalModule {}
