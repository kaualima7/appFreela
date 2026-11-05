import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC } from './public.decorator';
import type { AuthenticatedRequest } from './authenticated-request';
import { ACCOUNT_TYPES } from './account-types.decorator';
import type { AccountType } from '../generated/prisma/client';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer ([^ ]+)$/i);
    if (!match) throw new UnauthorizedException('Bearer token ausente.');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number; exp: number }>(
        match[1],
      );
      if (
        !Number.isInteger(payload.sub) ||
        payload.sub <= 0 ||
        payload.sub > 2147483647 ||
        !Number.isFinite(payload.exp)
      ) {
        throw new Error('Token sem identidade ou validade.');
      }
      const user = await this.users.findById(payload.sub);
      if (!user) throw new Error('Usuário não existe.');
      request.user = { sub: user.id, accountType: user.accountType };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
    const accountTypes = this.reflector.getAllAndOverride<AccountType[]>(
      ACCOUNT_TYPES,
      [context.getHandler(), context.getClass()],
    );
    if (accountTypes && !accountTypes.includes(request.user.accountType)) {
      throw new ForbiddenException(
        'Tipo de conta sem permissão para esta operação.',
      );
    }
    return true;
  }
}
