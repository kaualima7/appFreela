// Salva e consulta os contatos de cada freelancer.
// Um contato pode ter uma conta de cliente vinculada para liberar o acompanhamento dos projetos.

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

  // Quando há uma conta vinculada, confere se ela existe e é do tipo cliente.
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

  //contato 3: valida a conta vinculada como CLIENT e grava em Client; userId é o freelancer, clientUserId é a conta do cliente
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

  // Lista apenas os contatos cujo userId é o ID do freelancer autenticado.
  async findAll(userId: number) {
    if (userId <= 0) throw new BadRequestException('userId deve ser positivo.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não existe.');

    return this.prisma.client.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  // Busca pelo ID do contato junto com o ID do freelancer para proteger os dados de outras contas.
  async findOne(id: number, userId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id, userId },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    return client;
  }

  // Confere o acesso ao contato e a conta vinculada antes de salvar as alterações.
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

  // Exclui o contato somente se ele pertencer ao freelancer e não tiver projetos.
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
