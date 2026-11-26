// Recebe os pedidos da agenda de contatos em /api/clients, somente para freelancers.
// Passa o ID da conta autenticada ao ClientsService para limitar o acesso aos próprios contatos.

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
} from '@nestjs/common';
import { CreateClientDto } from '../dtos/create-client.dto';
import { UpdateClientDto } from '../dtos/update-client.dto';
import { ClientsService } from './clients.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AccountTypes } from '../auth/account-types.decorator';

@AccountTypes('FREELANCER')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  //contato 2: encaminha os dados e o ID do freelancer autenticado -> ClientsService.create em clients.service.ts
  @Post()
  create(@Body() dto: CreateClientDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  // GET /api/clients: consulta os contatos do freelancer autenticado.
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.service.findAll(request.user.sub);
  }

  // GET /api/clients/:id: consulta um registro usando o ID da URL.
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findOne(id, request.user.sub);
  }

  // PATCH /api/clients/:id: recebe os campos alterados e chama o serviço.
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, request.user.sub);
  }

  // DELETE /api/clients/:id: pede a exclusão; o serviço confere acesso e regras.
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.remove(id, request.user.sub);
  }
}
