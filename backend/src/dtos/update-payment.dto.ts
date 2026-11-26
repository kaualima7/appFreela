// Valida os campos enviados para alterar um pagamento.
// O ValidationPipe de main.ts aplica essas regras e responde 400 se os dados forem inválidos.

import {
  IsDateString,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PAYMENT_STATUSES } from './create-payment.dto';

export class UpdatePaymentDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/)
  amount?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsDateString({ strict: true })
  dueDate?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString({ strict: true })
  paidAt?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(100)
  paymentMethod?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(PAYMENT_STATUSES)
  status?: string;
}
