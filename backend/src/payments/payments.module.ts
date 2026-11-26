// Registra os controllers e serviços de pagamentos para uso pelo NestJS.

import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
})
export class PaymentsModule {}
