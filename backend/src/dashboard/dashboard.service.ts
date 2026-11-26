// Calcula os totais e os dados dos últimos seis meses para o painel do freelancer.
// Soma os registros pagos e consulta likes, anúncios, projetos e contatos.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
});

function localMonthKey(date: Date) {
  const parts = monthFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Reúne os dados do próprio freelancer para montar os totais e os gráficos do painel.
  async summary(freelancerId: number) {
    const [year, month] = localMonthKey(new Date()).split('-').map(Number);
    const months = Array.from(
      { length: 6 },
      (_, index) => new Date(Date.UTC(year, month - 6 + index, 1)),
    );
    const buckets = new Map(
      months.map((date) => [
        date.toISOString().slice(0, 7),
        { received: new Prisma.Decimal(0), likes: 0 },
      ]),
    );
    const firstMonth = months[0];
    // Entram no total recebido somente os registros com situação PAID.
    const paidPayments = {
      status: 'PAID',
      project: { client: { userId: freelancerId } },
    };

    // Agrupa as consultas ao banco em uma transação para montar um resumo consistente.
    const [total, payments, likes, services, projects, contacts] =
      await this.prisma.$transaction([
        this.prisma.payment.aggregate({
          where: paidPayments,
          _sum: { amount: true },
        }),
        this.prisma.payment.findMany({
          where: { ...paidPayments, paidAt: { gte: firstMonth } },
          select: { amount: true, paidAt: true },
        }),
        this.prisma.serviceInterest.findMany({
          where: { service: { freelancerId }, createdAt: { gte: firstMonth } },
          select: { createdAt: true },
        }),
        this.prisma.service.findMany({
          where: { freelancerId },
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            category: true,
            published: true,
            _count: { select: { interests: true } },
          },
        }),
        this.prisma.project.count({
          where: { client: { userId: freelancerId }, status: 'IN_PROGRESS' },
        }),
        this.prisma.client.findMany({
          where: { userId: freelancerId },
          select: { clientUserId: true },
        }),
      ]);

    for (const payment of payments) {
      if (!payment.paidAt) continue;
      // O formulário grava a data de recebimento à meia-noite UTC.
      const bucket = buckets.get(payment.paidAt.toISOString().slice(0, 7));
      if (bucket) bucket.received = bucket.received.plus(payment.amount);
    }
    for (const like of likes) {
      const bucket = buckets.get(localMonthKey(like.createdAt));
      if (bucket) bucket.likes++;
    }

    let mostLiked: {
      id: number;
      title: string;
      category: string;
      published: boolean;
      likes: number;
    } | null = null;
    let totalLikes = 0;
    for (const { _count, ...service } of services) {
      totalLikes += _count.interests;
      if (_count.interests > (mostLiked?.likes ?? 0)) {
        mostLiked = { ...service, likes: _count.interests };
      }
    }

    return {
      totalReceived: total._sum.amount?.toFixed(2) ?? '0.00',
      totalLikes,
      months: Array.from(buckets, ([month, values]) => ({
        month,
        received: values.received.toFixed(2),
        likes: values.likes,
      })),
      publishedServices: services.filter((service) => service.published).length,
      activeProjects: projects,
      contacts: contacts.length,
      linkedClients: new Set(
        contacts
          .map((contact) => contact.clientUserId)
          .filter((id) => id !== null),
      ).size,
      mostLiked,
    };
  }
}
