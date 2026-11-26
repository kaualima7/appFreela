// Recebe consultas e alterações do próprio perfil em /api/profiles.
// As rotas de áreas de atuação são exclusivas do freelancer.

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { UpdateSpecialtiesDto } from '../dtos/update-specialties.dto';
import { AccountTypes } from '../auth/account-types.decorator';
import { freelancerSpecialties } from './freelancer-specialties';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { ProfilesService } from './profiles.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Post()
  create(@Body() dto: CreateProfileDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  @Get('me')
  ownProfile(@Req() request: AuthenticatedRequest) {
    return this.service.findOwn(request.user.sub);
  }

  @AccountTypes('FREELANCER')
  @Get('me/specialty-options')
  specialtyOptions() {
    return freelancerSpecialties;
  }

  @AccountTypes('FREELANCER')
  @Patch('me/specialties')
  updateSpecialties(
    @Body() dto: UpdateSpecialtiesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.updateSpecialties(request.user.sub, dto.specialties);
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
    @Body() dto: UpdateProfileDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, request.user.sub);
  }
}
