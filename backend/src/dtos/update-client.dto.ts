// Valida os campos que podem ser enviados na edição de um contato.
// O ValidationPipe de main.ts aplica essas regras e responde 400 se os dados forem inválidos.

import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  IsInt,
  IsPositive,
  Max,
} from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(2147483647)
  // null retira o vínculo com a conta do cliente; omitir mantém o vínculo atual.
  clientUserId?: number | null;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
