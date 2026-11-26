// Valida nome, e-mail, senha e tipo de conta no cadastro.
// O ValidationPipe de main.ts aplica essas regras e responde 400 se os dados forem inválidos.

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AccountType } from '../generated/prisma/client';

//define as regras do cadastro: tipo válido quando informado, nome de 3 a 100 caracteres, e-mail válido e senha de pelo menos 6
export class CreateUserDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
