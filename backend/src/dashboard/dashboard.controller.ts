import { Controller, Get, Req } from '@nestjs/common';
import { AccountTypes } from '../auth/account-types.decorator';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { DashboardService } from './dashboard.service';

@AccountTypes('FREELANCER')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest) {
    return this.dashboard.summary(request.user.sub);
  }
}
