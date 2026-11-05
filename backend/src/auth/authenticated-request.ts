import type { Request } from 'express';
import type { AccountType } from '../generated/prisma/client';
export interface AuthenticatedRequest extends Request {
  user: { sub: number; accountType: AccountType };
}
