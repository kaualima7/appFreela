// Recebe login e cadastro da Web e do app em /api/auth.
// Encaminha os dados ao AuthService, em auth.service.ts.

import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from '../dtos/login.dto';
import { CreateUserDto } from '../dtos/create-user.dto';

//define /auth como caminho base dos endpoints deste controller
@Controller('auth')
export class AuthController {
  //recebe AuthService (NestJS) 
  constructor(private readonly auth: AuthService) {}

  //permite tentar entrar sem já estar autenticado
  @Public()
  //recebe POST /auth/login, enviado pela web ou pelo app
  @Post('login')
  // Define 200 como código de sucesso do login.
  //sucesso
  @HttpCode(200)
  //pega e-mail e senha do corpo da requisição
  login(@Body() dto: LoginDto) {
    //encaminha as credenciais ao AuthService e devolve o resultado
    return this.auth.login(dto);
  }

  @Public()
  //cad 3: recebe os dados validados pelo CreateUserDto -> backend/src/auth/auth.service.ts, método register
  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.auth.register(dto);
  }
}
