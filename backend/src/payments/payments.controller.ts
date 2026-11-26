// Recebe os pedidos de pagamentos em /api/payments, somente para freelancers.
// A consulta pode usar ?projectId= para selecionar um projeto.

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Delete,
  Query,
} from '@nestjs/common';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';
import { PaymentsService } from './payments.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AccountTypes } from '../auth/account-types.decorator';

@AccountTypes('FREELANCER')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // POST /api/payments: recebe o registro de pagamento para um projeto.
  @Post()
  create(@Body() dto: CreatePaymentDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  // GET /api/payments: consulta os pagamentos do freelancer autenticado.
  @Get()
  findAll(
    @Query('projectId', new ParseIntPipe({ optional: true }))
    projectId: number | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findAll(projectId, request.user.sub);
  }

  // GET /api/payments/:id: consulta um registro usando o ID da URL.
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findOne(id, request.user.sub);
  }

  // PATCH /api/payments/:id: recebe os campos alterados e chama o serviço.
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, request.user.sub);
  }

  // DELETE /api/payments/:id: pede a exclusão; o serviço confere acesso e regras.
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.remove(id, request.user.sub);
  }
}
