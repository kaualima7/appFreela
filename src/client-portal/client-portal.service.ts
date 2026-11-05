import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';

// O contato e suas notas pertencem ao freelancer e não fazem parte destas respostas.
const clientProjectSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  startDate: true,
  deadline: true,
  value: true,
  client: { select: { user: { select: { id: true, name: true } } } },
} satisfies Prisma.ProjectSelect;

const clientPaymentSelect = {
  id: true,
  projectId: true,
  amount: true,
  dueDate: true,
  paidAt: true,
  paymentMethod: true,
  status: true,
} satisfies Prisma.PaymentSelect;

type ClientProject = Prisma.ProjectGetPayload<{
  select: typeof clientProjectSelect;
}>;

@Injectable()
export class ClientPortalService {
  constructor(private readonly prisma: PrismaService) {}

  private validateId(id: number) {
    if (id <= 0 || id > 2147483647)
      throw new BadRequestException('ID inválido.');
  }

  private formatProject(project: ClientProject) {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      deadline: project.deadline,
      value: project.value.toFixed(2),
      projectOwner: project.client.user,
    };
  }

  async projects(clientUserId: number) {
    const projects = await this.prisma.project.findMany({
      where: { client: { clientUserId } },
      select: clientProjectSelect,
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((project) => this.formatProject(project));
  }

  async project(projectId: number, clientUserId: number) {
    this.validateId(projectId);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, client: { clientUserId } },
      select: clientProjectSelect,
    });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return this.formatProject(project);
  }

  async payments(projectId: number | undefined, clientUserId: number) {
    if (projectId !== undefined) await this.project(projectId, clientUserId);
    const payments = await this.prisma.payment.findMany({
      where: { projectId, project: { client: { clientUserId } } },
      select: clientPaymentSelect,
      orderBy: { dueDate: 'asc' },
    });
    return payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toFixed(2),
    }));
  }

  async payment(paymentId: number, clientUserId: number) {
    this.validateId(paymentId);
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, project: { client: { clientUserId } } },
      select: clientPaymentSelect,
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');
    return { ...payment, amount: payment.amount.toFixed(2) };
  }
}
