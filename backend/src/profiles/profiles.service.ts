// Cria e altera o perfil da conta autenticada e salva as áreas de atuação do freelancer.

import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}
  // Confere se a conta existe e ainda não tem perfil antes de criar o registro.
  async create(dto: CreateProfileDto, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuário não existe.');
    }

    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: userId },
    });

    if (existingProfile) {
      throw new ConflictException('Usuário já possui um perfil.');
    }

    return this.prisma.profile.create({
      data: {
        userId: userId,
        fullName: dto.fullName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        avatarUrl: dto.avatarUrl,
      },
    });
  }

  // Consulta nome completo e foto pelo ID da conta autenticada.
  async findOwn(userId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { fullName: true, avatarUrl: true },
    });
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    return profile;
  }

  // Salva na conta do freelancer a seleção já validada pelo UpdateSpecialtiesDto.
  async updateSpecialties(freelancerId: number, specialties: string[]) {
    return this.prisma.user.update({
      where: { id: freelancerId, accountType: 'FREELANCER' },
      data: { specialties },
      select: { specialties: true },
    });
  }

  // Exige que o perfil solicitado pertença à conta autenticada.
  async findOne(id: number, userId: number) {
    const profile = await this.prisma.profile.findFirst({
      where: { id, userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return profile;
  }

  // Confere o dono do perfil antes de salvar os campos recebidos.
  async update(id: number, dto: UpdateProfileDto, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.profile.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        avatarUrl: dto.avatarUrl,
      },
    });
  }
}
