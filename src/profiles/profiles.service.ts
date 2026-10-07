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
  async create(dto: CreateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new BadRequestException('Usuário não existe.');
    }

    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: dto.userId },
    });

    if (existingProfile) {
      throw new ConflictException('Usuário já possui um perfil.');
    }

    return this.prisma.profile.create({
      data: {
        userId: dto.userId,
        fullName: dto.fullName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        avatarUrl: dto.avatarUrl,
      },
    });
  }

  async findOne(id: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return profile;
  }

  async update(id: number, dto: UpdateProfileDto) {
    await this.findOne(id);

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
