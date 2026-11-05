import { SetMetadata } from '@nestjs/common';
import type { AccountType } from '../generated/prisma/client';

export const ACCOUNT_TYPES = 'accountTypes';
export const AccountTypes = (...accountTypes: AccountType[]) =>
  SetMetadata(ACCOUNT_TYPES, accountTypes);
