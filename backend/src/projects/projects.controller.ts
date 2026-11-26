// Recebe os pedidos de projetos em /api/projects, somente para freelancers.
// ProjectsService confere os contatos, as datas e o acesso aos registros.

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
import { CreateProjectDto } from '../dtos/create-project.dto';
import { UpdateProjectDto } from '../dtos/update-project.dto';
import { ProjectsService } from './projects.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AccountTypes } from '../auth/account-types.decorator';

@AccountTypes('FREELANCER')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  //proj 2: recebe os dados e encaminha com o ID do freelancer autenticado -> ProjectsService.create em projects.service.ts
  @Post()
  create(@Body() dto: CreateProjectDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  // GET /api/projects: consulta os projetos do freelancer autenticado.
  @Get()
  findAll(
    @Query('clientId', new ParseIntPipe({ optional: true }))
    clientId: number | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findAll(clientId, request.user.sub);
  }

  // GET /api/projects/:id: consulta um registro usando o ID da URL.
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findOne(id, request.user.sub);
  }

  // PATCH /api/projects/:id: recebe os campos alterados e chama o serviço.
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, request.user.sub);
  }

  // DELETE /api/projects/:id: pede a exclusão; o serviço confere acesso e regras.
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.remove(id, request.user.sub);
  }
}
