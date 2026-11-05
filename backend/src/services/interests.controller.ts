import { Controller, Get, Req } from '@nestjs/common';
import { AccountTypes } from '../auth/account-types.decorator';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { ServicesService } from './services.service';

@AccountTypes('CLIENT')
@Controller('interests')
export class InterestsController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  findMine(@Req() request: AuthenticatedRequest) {
    return this.service.myInterests(request.user.sub);
  }
}
