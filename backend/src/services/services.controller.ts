// Recebe os pedidos de anúncios e likes em /api/services.
// A vitrine é pública; criar anúncios exige freelancer e dar like exige cliente.

import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AccountTypes } from '../auth/account-types.decorator';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { Public } from '../auth/public.decorator';
import { CreateServiceDto } from '../dtos/create-service.dto';
import { UpdateServiceDto } from '../dtos/update-service.dto';
import { ServicesService } from './services.service';
import { readServiceCover, type ServiceCoverFile } from './service-cover';
import {
  ServiceCoverUpload,
  ServiceFormInterceptor,
} from './service-form.interceptor';

@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Public()
  @Get()
  catalog() {
    return this.service.catalog();
  }

  @AccountTypes('FREELANCER')
  // GET /api/services/mine: anúncios da própria conta, incluindo os não publicados.
  @Get('mine')
  findMine(@Req() request: AuthenticatedRequest) {
    return this.service.findMine(request.user.sub);
  }

  @AccountTypes('FREELANCER')
  // GET /api/services/mine/:id: busca o próprio anúncio para preencher a edição.
  @Get('mine/:id')
  findOwn(
    @Param('id', ParseIntPipe) serviceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.findOwn(serviceId, request.user.sub);
  }

  @Public()
  @Get('covers/:fileName')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-cache')
  cover(@Param('fileName') fileName: string) {
    return readServiceCover(fileName);
  }

  @Public()
  @Get(':id')
  details(@Param('id', ParseIntPipe) serviceId: number) {
    return this.service.details(serviceId);
  }

  @AccountTypes('FREELANCER')
  @Post()
  //capa 3: recebe arquivo e dados; create em services.service.ts recebe também o ID do freelancer autenticado
  @UseInterceptors(ServiceCoverUpload, ServiceFormInterceptor)
  create(
    @Body() dto: CreateServiceDto,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() cover?: ServiceCoverFile,
  ) {
    return this.service.create(dto, request.user.sub, cover);
  }

  @AccountTypes('FREELANCER')
  @Patch(':id')
  @UseInterceptors(ServiceCoverUpload, ServiceFormInterceptor)
  update(
    @Param('id', ParseIntPipe) serviceId: number,
    @Body() dto: UpdateServiceDto,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() cover?: ServiceCoverFile,
  ) {
    return this.service.update(serviceId, dto, request.user.sub, cover);
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
  //like 3: recebe o ID do anúncio pela URL e o ID do cliente pelo token -> confirmInterest em services.service.ts
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
  //interessados: consulta de freelancer -> interestedClients em services.service.ts verifica se o anúncio pertence a ele
  @Get(':id/interests')
  interestedClients(
    @Param('id', ParseIntPipe) serviceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.interestedClients(serviceId, request.user.sub);
  }
}
