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

  private formatResponse(project: ProjectModel) {
    return { ...project, value: project.value.toFixed(2) };
  }

  private validateDates(startDate: Date, deadline?: Date | null) {
    if (deadline && deadline < startDate) {
      throw new BadRequestException(
        'Prazo não pode ser anterior a data inicial.',
      );
    }
  }

  async create(dto: CreateProjectDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) throw new BadRequestException('Cliente não existe.');
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const deadline = dto.deadline ? new Date(dto.deadline) : undefined;
    this.validateDates(startDate, deadline);
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

  async findAll(clientId: number) {
    if (clientId <= 0 || clientId > 2147483647)
      throw new BadRequestException('clientId inválido.');
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) throw new BadRequestException('Cliente não existe.');
    const projects = await this.prisma.project.findMany({
      where: { clientId },
      orderBy: { title: 'asc' },
    });
    return projects.map((project) => this.formatResponse(project));
  }

  async findOne(id: number) {
    if (id <= 0 || id > 2147483647)
      throw new BadRequestException('ID de projeto inválido.');
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return this.formatResponse(project);
  }

  async update(id: number, dto: UpdateProjectDto) {
    const current = await this.findOne(id);
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

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Projeto excluído com sucesso.' };
  }
}
