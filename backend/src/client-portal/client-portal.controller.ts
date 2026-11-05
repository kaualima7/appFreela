import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { AccountTypes } from '../auth/account-types.decorator';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { ClientPortalService } from './client-portal.service';

@AccountTypes('CLIENT')
@Controller('client-portal')
export class ClientPortalController {
  constructor(private readonly service: ClientPortalService) {}

  @Get('projects')
  projects(@Req() request: AuthenticatedRequest) {
    return this.service.projects(request.user.sub);
  }

  @Get('projects/:id')
  project(
    @Param('id', ParseIntPipe) projectId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.project(projectId, request.user.sub);
  }

  @Get('payments')
  payments(
    @Query('projectId', new ParseIntPipe({ optional: true }))
    projectId: number | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.payments(projectId, request.user.sub);
  }

  @Get('payments/:id')
  payment(
    @Param('id', ParseIntPipe) paymentId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.payment(paymentId, request.user.sub);
  }
}
