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

  @Post()
  create(@Body() dto: CreateProjectDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  @Get()
  findAll(
    @Query('clientId', new ParseIntPipe({ optional: true }))
    clientId: number | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findAll(clientId, request.user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findOne(id, request.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, request.user.sub);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.remove(id, request.user.sub);
  }
}
