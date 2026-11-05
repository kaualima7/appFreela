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

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    return this.tokenFor(user);
  }

  async register(dto: CreateUserDto) {
    const user = await this.users.createUser(dto);
    return this.tokenFor(user);
  }
}
