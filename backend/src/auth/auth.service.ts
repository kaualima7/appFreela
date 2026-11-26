// Confere os dados de login e gera o token de acesso.
// No cadastro, pede ao UsersService para criar a conta e depois gera o token.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginDto } from '../dtos/login.dto';
import type { AccountType } from '../generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  // Gera o token com o ID da conta em sub e devolve os dados do usuário, sem a senha.
  private async tokenFor(user: {
    id: number;
    name: string;
    email: string;
    accountType: AccountType;
  }) {
    return {
      access_token: await this.jwt.signAsync({ sub: user.id }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
      },
    };
  }

  // Busca a conta pelo e-mail e confere a senha antes de gerar o token.
  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    // bcrypt compara a senha digitada com a versão protegida salva no banco; falha resulta em 401.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    return this.tokenFor(user);
  }

  //cad 4: pede a criação da conta -> backend/src/users/users.service.ts, método createUser
  async register(dto: CreateUserDto) {
    const user = await this.users.createUser(dto);
    //conta criada: tokenFor gera token e dados do usuário; a resposta volta ao formulário (cadastro 6)
    return this.tokenFor(user);
  }
}
