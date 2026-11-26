// Salva e consulta projetos ligados aos contatos do freelancer autenticado.
// O campo value guarda o valor combinado para o trabalho.

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import type { ProjectModel } from '../generated/prisma/models/Project';
import { CreateProjectDto } from '../dtos/create-project.dto';
import { UpdateProjectDto } from '../dtos/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Devolve o valor com duas casas decimais para manter o mesmo formato na API.
  private formatResponse(project: ProjectModel) {
    return { ...project, value: project.value.toFixed(2) };
  }

  // Impede cadastrar um prazo anterior à data de início do trabalho.
  private validateDates(startDate: Date, deadline?: Date | null) {
    if (deadline && deadline < startDate) {
      throw new BadRequestException(
        'Prazo não pode ser anterior a data inicial.',
      );
    }
  }

  //proj 3: confere se o contato pertence ao freelancer e se as datas são válidas antes de criar
  async create(dto: CreateProjectDto, userId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, userId },
    });
    if (!client) throw new BadRequestException('Cliente não existe.');
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const deadline = dto.deadline ? new Date(dto.deadline) : undefined;
    this.validateDates(startDate, deadline);
    //grava o projeto ligado ao contato pelo clientId; value é o valor combinado, não um recebimento
    const project = await this.prisma.project.create({
      data: {
        clientId: dto.clientId,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        startDate,
        deadline,
        value: new Prisma.Decimal(dto.value),
      },
    });
    return this.formatResponse(project);
  }

  // Lista projetos dos próprios contatos; clientId permite filtrar por um contato específico.
  async findAll(clientId: number | undefined, userId: number) {
    if (clientId !== undefined) {
      if (clientId <= 0 || clientId > 2147483647)
        throw new BadRequestException('clientId inválido.');
      const client = await this.prisma.client.findFirst({
        where: { id: clientId, userId },
      });
      if (!client) throw new BadRequestException('Cliente não existe.');
    }
    const projects = await this.prisma.project.findMany({
      where: { clientId, client: { userId } },
      orderBy: { title: 'asc' },
    });
    return projects.map((project) => this.formatResponse(project));
  }

  // Confere o acesso pelo caminho projeto, contato e freelancer dono do contato.
  async findOne(id: number, userId: number) {
    if (id <= 0 || id > 2147483647)
      throw new BadRequestException('ID de projeto inválido.');
    const project = await this.prisma.project.findFirst({
      where: { id, client: { userId } },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return this.formatResponse(project);
  }

  // Confere o acesso e as datas antes de salvar os campos alterados.
  async update(id: number, dto: UpdateProjectDto, userId: number) {
    const current = await this.findOne(id, userId);
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : current.startDate;
    const deadline = dto.deadline ? new Date(dto.deadline) : current.deadline;
    this.validateDates(startDate, deadline);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        value:
          dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
      },
    });
    return this.formatResponse(project);
  }

  // Confere o acesso antes de excluir; o schema também remove os pagamentos ligados ao projeto.
  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Projeto excluído com sucesso.' };
  }
}
