// Cuida dos anúncios e dos likes no banco, com as regras de acesso de cada conta.
// Também chama service-cover.ts para salvar ou remover arquivos de capa.

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
import {
  publicCoverUrl,
  removeServiceCover,
  storeServiceCover,
  type ServiceCoverFile,
} from './service-cover';

// Escolhe os campos públicos do profissional que podem aparecer na vitrine.
const publicFreelancerSelect = {
  id: true,
  name: true,
  profile: { select: { fullName: true, avatarUrl: true } },
} satisfies Prisma.UserSelect;

const publicServiceFields = {
  id: true,
  title: true,
  description: true,
  category: true,
  startingPrice: true,
  imageUrl: true,
} satisfies Prisma.ServiceSelect;

const publicServiceSelect = {
  ...publicServiceFields,
  freelancer: { select: publicFreelancerSelect },
} satisfies Prisma.ServiceSelect;

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // Consulta o perfil público e inclui somente os anúncios publicados desse freelancer.
  async publicFreelancer(freelancerId: number) {
    const freelancer = await this.prisma.user.findFirst({
      where: { id: freelancerId, accountType: 'FREELANCER' },
      select: {
        ...publicFreelancerSelect,
        specialties: true,
        services: {
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          select: publicServiceFields,
        },
      },
    });
    if (!freelancer) throw new NotFoundException('Freelancer não encontrado.');
    return {
      ...freelancer,
      services: freelancer.services.map((service) =>
        this.formatResponse(service),
      ),
    };
  }

  private validateId(serviceId: number) {
    if (serviceId <= 0 || serviceId > 2147483647) {
      throw new BadRequestException('ID de serviço inválido.');
    }
  }

  // Padroniza o preço e transforma a referência da capa em URL para a Web e o app.
  private formatResponse<
    T extends Pick<ServiceModel, 'startingPrice' | 'imageUrl'>,
  >(service: T) {
    return {
      ...service,
      startingPrice: service.startingPrice.toFixed(2),
      imageUrl: publicCoverUrl(service.imageUrl),
    };
  }

  // Vitrine: consulta somente anúncios publicados, do mais recente para o mais antigo.
  async catalog() {
    const services = await this.prisma.service.findMany({
      where: { published: true },
      select: publicServiceSelect,
      orderBy: { createdAt: 'desc' },
    });
    return services.map((service) => this.formatResponse(service));
  }

  // Abre somente um anúncio publicado; se estiver oculto ou não existir, responde 404.
  async details(serviceId: number) {
    this.validateId(serviceId);
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, published: true },
      select: publicServiceSelect,
    });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    return this.formatResponse(service);
  }

  // Lista todos os anúncios do próprio freelancer, incluindo os que ainda não foram publicados.
  async findMine(freelancerId: number) {
    const services = await this.prisma.service.findMany({
      where: { freelancerId },
      orderBy: { createdAt: 'desc' },
    });
    return services.map((service) => this.formatResponse(service));
  }

  // Busca o anúncio pelo ID e pelo dono para permitir sua administração.
  async findOwn(serviceId: number, freelancerId: number) {
    this.validateId(serviceId);
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, freelancerId },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    return this.formatResponse(service);
  }

  // Salva o anúncio ligado ao freelancer autenticado e remove a nova capa se a gravação falhar.
  async create(
    dto: CreateServiceDto,
    freelancerId: number,
    cover?: ServiceCoverFile,
  ) {
    //capa 4: storeServiceCover em service-cover.ts salva o arquivo; o Prisma grava sua referência em imageUrl
    const uploadedCover = cover ? await storeServiceCover(cover) : null;
    try {
      const service = await this.prisma.service.create({
        data: {
          freelancerId,
          title: dto.title,
          description: dto.description,
          category: dto.category,
          startingPrice: new Prisma.Decimal(dto.startingPrice),
          imageUrl: uploadedCover ?? dto.imageUrl,
          published: dto.published,
        },
      });
      return this.formatResponse(service);
    } catch (error) {
      await removeServiceCover(uploadedCover);
      throw error;
    }
  }

  // Confere o dono, salva as alterações e remove a capa antiga se ela tiver sido substituída.
  async update(
    serviceId: number,
    dto: UpdateServiceDto,
    freelancerId: number,
    cover?: ServiceCoverFile,
  ) {
    this.validateId(serviceId);
    if (cover) await this.findOwn(serviceId, freelancerId);
    const uploadedCover = cover ? await storeServiceCover(cover) : null;
    const imageUrl = uploadedCover ?? dto.imageUrl;
    const saved = await this.prisma
      .$transaction(async (prisma) => {
        const previous = await prisma.service.findFirst({
          where: { id: serviceId, freelancerId },
          select: { imageUrl: true },
        });
        if (!previous) throw new NotFoundException('Serviço não encontrado.');

        const service = await prisma.service.update({
          where: { id: serviceId, freelancerId },
          data: {
            title: dto.title,
            description: dto.description,
            category: dto.category,
            startingPrice:
              dto.startingPrice === undefined
                ? undefined
                : new Prisma.Decimal(dto.startingPrice),
            imageUrl,
            published: dto.published,
          },
        });
        return { service, previousCover: previous.imageUrl };
      })
      .catch(async (error: unknown) => {
        await removeServiceCover(uploadedCover);
        throw error;
      });
    if (saved.previousCover !== saved.service.imageUrl)
      await removeServiceCover(saved.previousCover);
    return this.formatResponse(saved.service);
  }

  // Exclui o anúncio do próprio freelancer e depois tenta remover seu arquivo de capa.
  async remove(serviceId: number, freelancerId: number) {
    this.validateId(serviceId);
    const service = await this.prisma.service
      .delete({
        where: { id: serviceId, freelancerId },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Serviço não encontrado.');
        }
        throw error;
      });
    await removeServiceCover(service.imageUrl);
    return { message: 'Serviço excluído com sucesso.' };
  }

  //like 4: exige anúncio publicado e grava o vínculo anúncio-cliente em ServiceInterest; duplicidade retorna 409
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

  //retira somente o like deste cliente neste anúncio
  async withdrawInterest(serviceId: number, clientUserId: number) {
    this.validateId(serviceId);
    const removed = await this.prisma.serviceInterest.deleteMany({
      where: { serviceId, clientUserId },
    });
    if (!removed.count)
      throw new NotFoundException('Interesse não encontrado.');
    return { message: 'Interesse retirado com sucesso.' };
  }

  // Lista os likes do cliente com os dados dos anúncios, inclusive os que deixaram de ser publicados.
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

  //interessados: confere o dono do anúncio e consulta likes com nome e e-mail dos clientes; não altera o banco
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
