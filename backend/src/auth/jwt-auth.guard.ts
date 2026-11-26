// Confere o token antes de liberar uma rota protegida.
// Também verifica se o tipo de conta pode realizar a operação.

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

  // Executa antes do controller: libera rotas públicas e confere a identidade nas demais.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // O token deve chegar no cabeçalho Authorization no formato Bearer seguido do token.
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
      // Guarda a identidade conferida para o controller usar; o ID vem do token validado.
      request.user = { sub: user.id, accountType: user.accountType };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
    // Se a conta estiver autenticada, mas seu tipo não for permitido, responde 403.
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
