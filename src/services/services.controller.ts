import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AccountTypes } from '../auth/account-types.decorator';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { Public } from '../auth/public.decorator';
import { CreateServiceDto } from '../dtos/create-service.dto';
import { UpdateServiceDto } from '../dtos/update-service.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Public()
  @Get()
  catalog() {
    return this.service.catalog();
  }

  @AccountTypes('FREELANCER')
  @Get('mine')
  findMine(@Req() request: AuthenticatedRequest) {
    return this.service.findMine(request.user.sub);
  }

  @AccountTypes('FREELANCER')
  @Get('mine/:id')
  findOwn(
    @Param('id', ParseIntPipe) serviceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findOwn(serviceId, request.user.sub);
  }

  @Public()
  @Get(':id')
  details(@Param('id', ParseIntPipe) serviceId: number) {
    return this.service.details(serviceId);
  }

  @AccountTypes('FREELANCER')
  @Post()
  create(@Body() dto: CreateServiceDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  @AccountTypes('FREELANCER')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) serviceId: number,
    @Body() dto: UpdateServiceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.update(serviceId, dto, request.user.sub);
  }

  @AccountTypes('FREELANCER')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) serviceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.remove(serviceId, request.user.sub);
  }

  @AccountTypes('CLIENT')
  @Post(':id/interest')
  confirmInterest(
    @Param('id', ParseIntPipe) serviceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.confirmInterest(serviceId, request.user.sub);
  }

  @AccountTypes('CLIENT')
  @Delete(':id/interest')
  withdrawInterest(
    @Param('id', ParseIntPipe) serviceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.withdrawInterest(serviceId, request.user.sub);
  }

  @AccountTypes('FREELANCER')
  @Get(':id/interests')
  interestedClients(
    @Param('id', ParseIntPipe) serviceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.interestedClients(serviceId, request.user.sub);
  }
}
