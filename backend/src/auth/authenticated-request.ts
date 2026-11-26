// Define os dados do usuário que o JwtAuthGuard coloca na requisição.
// sub é o ID da conta autenticada; accountType indica cliente ou freelancer.

import type { Request } from 'express';
import type { AccountType } from '../generated/prisma/client';
export interface AuthenticatedRequest extends Request {
  user: { sub: number; accountType: AccountType };
}
