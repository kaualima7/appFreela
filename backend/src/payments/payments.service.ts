// Registra parcelas e recebimentos dos projetos do freelancer.
// Confere se a situação do pagamento combina com a data de recebimento.

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import type { PaymentModel } from '../generated/prisma/models/Payment';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Devolve o valor do pagamento como texto com duas casas decimais.
  private formatResponse(payment: PaymentModel) {
    return { ...payment, amount: payment.amount.toFixed(2) };
  }

  // Exige data de recebimento quando está pago e impede essa data nas demais situações.
  private validatePayment(status: string, paidAt?: Date | null) {
    if (status === 'PAID' && !paidAt) {
      throw new BadRequestException(
        'Pagamento pago deve ter data de pagamento.',
      );
    }
    if (status !== 'PAID' && paidAt) {
      throw new BadRequestException(
        'Data de pagamento só é permitida no estado PAID.',
      );
    }
  }

  // Confere se o projeto pertence ao freelancer e grava o pagamento após validar a situação.
  async create(dto: CreatePaymentDto, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, client: { userId } },
    });
    if (!project) throw new BadRequestException('Projeto não existe.');
    const status = dto.status ?? 'PENDING';
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : null;
    this.validatePayment(status, paidAt);
    const payment = await this.prisma.payment.create({
      data: {
        projectId: dto.projectId,
        amount: new Prisma.Decimal(dto.amount),
        dueDate: new Date(dto.dueDate),
        paidAt,
        paymentMethod: dto.paymentMethod,
        status,
      },
    });
    return this.formatResponse(payment);
  }

  // Lista pagamentos dos projetos do freelancer, com filtro opcional por projectId.
  async findAll(projectId: number | undefined, userId: number) {
    if (projectId !== undefined) {
      if (projectId <= 0 || projectId > 2147483647)
        throw new BadRequestException('projectId inválido.');
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, client: { userId } },
      });
      if (!project) throw new BadRequestException('Projeto não existe.');
    }
    const payments = await this.prisma.payment.findMany({
      where: { projectId, project: { client: { userId } } },
      orderBy: { dueDate: 'asc' },
    });
    return payments.map((payment) => this.formatResponse(payment));
  }

  // Confere o acesso seguindo as relações pagamento, projeto e contato do freelancer.
  async findOne(id: number, userId: number) {
    if (id <= 0 || id > 2147483647)
      throw new BadRequestException('ID de pagamento inválido.');
    const payment = await this.prisma.payment.findFirst({
      where: { id, project: { client: { userId } } },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');
    return this.formatResponse(payment);
  }

  // Combina os dados atuais com as alterações para validar a situação antes de salvar.
  async update(id: number, dto: UpdatePaymentDto, userId: number) {
    const current = await this.findOne(id, userId);
    const status = dto.status ?? current.status;
    const paidAt =
      dto.paidAt === undefined
        ? current.paidAt
        : dto.paidAt === null
          ? null
          : new Date(dto.paidAt);
    this.validatePayment(status, paidAt);
    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        amount:
          dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        paidAt: dto.paidAt === undefined ? undefined : paidAt,
        paymentMethod: dto.paymentMethod,
        status: dto.status,
      },
    });
    return this.formatResponse(payment);
  }

  // Confere o acesso ao registro antes de excluir o pagamento.
  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Pagamento excluído com sucesso.' };
  }
}
