import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateClientDto } from '../dtos/create-client.dto';
import { UpdateClientDto } from '../dtos/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateClientAccount(clientUserId?: number | null) {
    if (clientUserId == null) return;
    const clientUser = await this.prisma.user.findUnique({
      where: { id: clientUserId },
      select: { accountType: true },
    });
    if (clientUser?.accountType !== 'CLIENT') {
      throw new BadRequestException(
        'A conta vinculada deve ser do tipo CLIENT.',
      );
    }
  }

  async create(dto: CreateClientDto, userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não existe.');

    await this.validateClientAccount(dto.clientUserId);

    return this.prisma.client.create({
      data: {
        userId: userId,
        clientUserId: dto.clientUserId,
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
    await this.validateClientAccount(dto.clientUserId);
    return this.prisma.client.update({
      where: { id },
      data: {
        clientUserId: dto.clientUserId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        notes: dto.notes,
      },
    });
  }

  async remove(id: number, userId: number) {
    // A condição é verificada na própria exclusão para evitar a cascata.
    const result = await this.prisma.client.deleteMany({
      where: { id, userId, projects: { none: {} } },
    });

    if (result.count === 0) {
      await this.findOne(id, userId);
      throw new ConflictException(
        'Este contato tem projetos vinculados e não pode ser excluído.',
      );
    }

    return { message: 'Contato excluído com sucesso.' };
  }
}
