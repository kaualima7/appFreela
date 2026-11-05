import {
  IsDateString,
  IsIn,
  IsInt,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'CANCELLED'];

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  @Max(2147483647)
  projectId: number;

  @IsString()
  @Matches(/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/)
  amount: string;

  @IsDateString({ strict: true })
  dueDate: string;

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
