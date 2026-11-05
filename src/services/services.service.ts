import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateServiceDto } from '../dtos/create-service.dto';
import { UpdateServiceDto } from '../dtos/update-service.dto';
import type { ServiceModel } from '../generated/prisma/models/Service';

// O catálogo não divulga e-mail, nascimento ou informações internas do profissional.
const publicServiceSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  startingPrice: true,
  imageUrl: true,
  freelancer: {
    select: {
      id: true,
      name: true,
      profile: { select: { fullName: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.ServiceSelect;

type PublicService = Prisma.ServiceGetPayload<{
  select: typeof publicServiceSelect;
}>;

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateId(serviceId: number) {
    if (serviceId <= 0 || serviceId > 2147483647) {
      throw new BadRequestException('ID de serviço inválido.');
    }
  }

  private formatResponse(service: ServiceModel | PublicService) {
    return { ...service, startingPrice: service.startingPrice.toFixed(2) };
  }

  async catalog() {
    const services = await this.prisma.service.findMany({
      where: { published: true },
      select: publicServiceSelect,
      orderBy: { createdAt: 'desc' },
    });
    return services.map((service) => this.formatResponse(service));
  }

  async details(serviceId: number) {
    this.validateId(serviceId);
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, published: true },
      select: publicServiceSelect,
    });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    return this.formatResponse(service);
  }

  async findMine(freelancerId: number) {
    const services = await this.prisma.service.findMany({
      where: { freelancerId },
      orderBy: { createdAt: 'desc' },
    });
    return services.map((service) => this.formatResponse(service));
  }

  async findOwn(serviceId: number, freelancerId: number) {
    this.validateId(serviceId);
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, freelancerId },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    return this.formatResponse(service);
  }

  async create(dto: CreateServiceDto, freelancerId: number) {
    const service = await this.prisma.service.create({
      data: {
        freelancerId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        startingPrice: new Prisma.Decimal(dto.startingPrice),
        imageUrl: dto.imageUrl,
        published: dto.published,
      },
    });
    return this.formatResponse(service);
  }

  async update(serviceId: number, dto: UpdateServiceDto, freelancerId: number) {
    await this.findOwn(serviceId, freelancerId);
    const service = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        startingPrice:
          dto.startingPrice === undefined
            ? undefined
            : new Prisma.Decimal(dto.startingPrice),
        imageUrl: dto.imageUrl,
        published: dto.published,
      },
    });
    return this.formatResponse(service);
  }

  async remove(serviceId: number, freelancerId: number) {
    await this.findOwn(serviceId, freelancerId);
    await this.prisma.service.delete({ where: { id: serviceId } });
    return { message: 'Serviço excluído com sucesso.' };
  }

  async confirmInterest(serviceId: number, clientUserId: number) {
    await this.details(serviceId);
    try {
      return await this.prisma.serviceInterest.create({
        data: { serviceId, clientUserId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Interesse já confirmado neste serviço.');
      }
      throw error;
    }
  }

  async withdrawInterest(serviceId: number, clientUserId: number) {
    this.validateId(serviceId);
    // É possível retirar o interesse mesmo se o serviço foi despublicado.
    const removed = await this.prisma.serviceInterest.deleteMany({
      where: { serviceId, clientUserId },
    });
    if (!removed.count)
      throw new NotFoundException('Interesse não encontrado.');
    return { message: 'Interesse retirado com sucesso.' };
  }

  async myInterests(clientUserId: number) {
    const interests = await this.prisma.serviceInterest.findMany({
      where: { clientUserId },
      select: {
        id: true,
        serviceId: true,
        createdAt: true,
        service: { select: { ...publicServiceSelect, published: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return interests.map((interest) => ({
      ...interest,
      service: this.formatResponse(interest.service),
    }));
  }

  async interestedClients(serviceId: number, freelancerId: number) {
    await this.findOwn(serviceId, freelancerId);
    return this.prisma.serviceInterest.findMany({
      where: { serviceId },
      select: {
        id: true,
        serviceId: true,
        createdAt: true,
        clientUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
