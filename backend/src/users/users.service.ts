// Consulta e altera contas no banco usando o Prisma.
// Também protege a senha no cadastro e impede alterações em contas de outras pessoas.

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-users.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Busca a conta usada na conferência de login; inclui o hash para comparar a senha.
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Confirma que o usuário do token ainda existe e consulta seu tipo de conta atual.
  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, accountType: true },
    });
  }

  //cad 5: verifica se o email ja existe. se existir = 409
  async createUser(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    //gera o hash para nao gravar a senha original no banco
    const passwordHash = await bcrypt.hash(dto.password, 10); 

    //grava a conta pelo prisma e retorna os campos do select, sem o hash da senha
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        accountType: dto.accountType,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        accountType: true,
      },
    });//->front form
  }

  // Apesar do nome, retorna somente a conta autenticada, sem o hash da senha.
  async getAllUsers(userId: number) {
    return this.prisma.user.findMany({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        accountType: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Confere o dono da conta e o e-mail antes de atualizar; também sincroniza o nome do perfil.
  async updateUser(id: number, dto: UpdateUserDto, userId: number) {
    if (id !== userId)
      throw new ForbiddenException('Acesso permitido somente à própria conta.');
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (dto.email !== undefined) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    const name = dto.name?.trim();
    return this.prisma.$transaction(async (prisma) => {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { name, email: dto.email },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          accountType: true,
        },
      });
      if (name !== undefined) {
        // O nome completo, quando cadastrado, aparece no perfil e nos anúncios.
        await prisma.profile.updateMany({
          where: { userId: id },
          data: { fullName: name },
        });
      }
      return updatedUser;
    });
  }

  // Exclui somente a própria conta; as relações do schema definem os registros afetados.
  async deleteUser(id: number, userId: number) {
    if (id !== userId)
      throw new ForbiddenException('Acesso permitido somente à própria conta.');
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Usuário excluído com sucesso' };
  }
}
