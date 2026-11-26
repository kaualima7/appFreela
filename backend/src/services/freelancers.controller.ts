// Recebe GET /api/freelancers/:id e devolve o perfil público com os anúncios publicados.

import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { ServicesService } from './services.service';

@Controller('freelancers')
export class FreelancersController {
  constructor(private readonly services: ServicesService) {}

  @Public()
  @Get(':id')
  profile(@Param('id') id: string) {
    if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) {
      throw new NotFoundException('Freelancer não encontrado.');
    }
    return this.services.publicFreelancer(Number(id));
  }
}
