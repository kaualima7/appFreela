// Consulta projetos e pagamentos pelo vínculo clientUserId do contato.
// Esse vínculo determina quais trabalhos a conta do cliente pode acompanhar.

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
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

  // Prepara os dados exibidos ao cliente e inclui o freelancer responsável em projectOwner.
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

  // Lista trabalhos de contatos cujo clientUserId aponta para a conta autenticada.
  async projects(clientUserId: number) {
    const projects = await this.prisma.project.findMany({
      where: { client: { clientUserId } },
      select: clientProjectSelect,
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((project) => this.formatProject(project));
  }

  // Consulta um projeto somente quando seu contato está vinculado à conta do cliente.
  async project(projectId: number, clientUserId: number) {
    this.validateId(projectId);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, client: { clientUserId } },
      select: clientProjectSelect,
    });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return this.formatProject(project);
  }

  // Lista pagamentos dos trabalhos vinculados ao cliente; projectId pode limitar a consulta.
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

  // Consulta um pagamento somente se ele fizer parte de um trabalho vinculado ao cliente.
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
