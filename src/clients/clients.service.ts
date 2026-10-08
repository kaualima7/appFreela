import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateClientDto } from '../dtos/create-client.dto';
import { UpdateClientDto } from '../dtos/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto, userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não existe.');

    return this.prisma.client.create({
      data: {
        userId: userId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        notes: dto.notes,
      },
    });
  }

  async findAll(userId: number) {
    if (userId <= 0) throw new BadRequestException('userId deve ser positivo.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não existe.');

    return this.prisma.client.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, userId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id, userId },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    return client;
  }

  async update(id: number, dto: UpdateClientDto, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.client.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        notes: dto.notes,
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    await this.prisma.client.delete({ where: { id } });
    return { message: 'Cliente excluído com sucesso.' };
  }
}
