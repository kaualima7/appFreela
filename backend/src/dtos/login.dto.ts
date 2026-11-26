// Valida e-mail e senha enviados na tentativa de login.
// O ValidationPipe de main.ts aplica essas regras e responde 400 se os dados forem inválidos.

import { IsEmail, IsString, MinLength } from 'class-validator';
export class LoginDto {
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(6)
  password: string;
}
